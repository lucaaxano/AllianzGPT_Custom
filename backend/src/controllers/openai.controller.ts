import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { config } from '../config';
import { createError } from '../middleware/error.middleware';
import { extractTextFromFile, extractTextFromPDF, getFileSizeInMB, MAX_FILE_SIZE_MB } from '../services/file.service';
import { convertPDFToImages, isScannedPDF } from '../services/pdf-vision.service';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export const chatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messages, chatId, model = 'gpt-5.2' } = req.body;

    // System prompt für alle Chats
    const systemPrompt = {
      role: 'system' as const,
      content: `Du bist Sena GPT, ein hilfreicher KI-Assistent.

Deine Eigenschaften:
- Du antwortest immer auf Deutsch, es sei denn, der Benutzer schreibt explizit in einer anderen Sprache
- Du bist professionell, freundlich und präzise
- Du hilfst bei allgemeinen Fragen, Textverarbeitung, Analysen und kreativen Aufgaben
- Bei sensiblen oder vertraulichen Themen weist du darauf hin, dass du keine echten Unternehmensdaten hast
- Du formatierst deine Antworten übersichtlich mit Markdown wenn sinnvoll`
    };

    // System prompt an den Anfang der Messages hinzufügen
    const messagesWithSystem = [systemPrompt, ...messages];

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return next(createError('Messages are required', 400));
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create OpenAI chat completion with streaming
    const stream = await openai.chat.completions.create({
      model,
      messages: messagesWithSystem as ChatCompletionMessageParam[],
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        // Send as SSE
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant message to database if chatId is provided
    if (chatId && fullContent) {
      await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: fullContent,
        },
      });

      // Update chat title if it's the first response
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { messages: true },
      });

      if (chat && chat.messages.length <= 2 && chat.title === 'Neuer Chat') {
        // Generate a title from the first user message
        const firstUserMessage = messages.find((m: ChatMessage) => m.role === 'user');
        if (firstUserMessage && typeof firstUserMessage.content === 'string') {
          const title = firstUserMessage.content.slice(0, 50) +
            (firstUserMessage.content.length > 50 ? '...' : '');
          await prisma.chat.update({
            where: { id: chatId },
            data: { title },
          });
        }
      }
    }

    // Send done event
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('OpenAI Error:', error);

    // If headers not sent yet, send error response
    if (!res.headersSent) {
      return next(createError(error.message || 'OpenAI API error', 500));
    }

    // If streaming already started, send error through SSE
    res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`);
    res.end();
  }
};

export const generateImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { prompt, chatId, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return next(createError('Prompt is required', 400));
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
    });

    const imageData = response.data?.[0];
    const imageUrl = imageData?.url;
    const revisedPrompt = imageData?.revised_prompt;

    if (!imageUrl) {
      return next(createError('Failed to generate image', 500));
    }

    // Save to chat if chatId provided
    if (chatId) {
      await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: JSON.stringify({
            type: 'image',
            url: imageUrl,
            prompt,
            revisedPrompt,
          }),
        },
      });
    }

    res.json({
      success: true,
      data: {
        url: imageUrl,
        revisedPrompt,
      },
    });
  } catch (error: any) {
    console.error('DALL-E Error:', error);
    next(createError(error.message || 'Image generation failed', 500));
  }
};

export const analyzeImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageUrl, imageBase64, prompt = 'What is in this image?', chatId } = req.body;

    if (!imageUrl && !imageBase64) {
      return next(createError('Image URL or base64 is required', 400));
    }

    const imageContent = imageBase64
      ? { url: `data:image/jpeg;base64,${imageBase64}` }
      : { url: imageUrl };

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: imageContent },
          ],
        },
      ],
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save to database if chatId provided
    if (chatId && fullContent) {
      await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: fullContent,
        },
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Vision Error:', error);

    if (!res.headersSent) {
      return next(createError(error.message || 'Image analysis failed', 500));
    }

    res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`);
    res.end();
  }
};

export const analyzeDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileBase64, fileName, mimeType, prompt, chatId } = req.body;

    if (!fileBase64 || !fileName || !mimeType) {
      return next(createError('File data, name, and type are required', 400));
    }

    // Check file size
    const fileSizeMB = getFileSizeInMB(fileBase64);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return next(createError(`Datei zu groß. Maximum: ${MAX_FILE_SIZE_MB}MB`, 400));
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, 'base64');

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // PDF-specific handling with scan detection
    if (mimeType === 'application/pdf') {
      try {
        const { text, pageCount } = await extractTextFromPDF(buffer);

        // Check if PDF is scanned (no/little text layer)
        if (isScannedPDF(text, pageCount)) {
          console.log(`[PDF] Scan erkannt (${pageCount} Seiten, ~${Math.round(text.length / Math.max(pageCount, 1))} Zeichen/Seite) - verwende GPT Vision für "${fileName}"`);

          // Convert PDF pages to images and use Vision
          const images = await convertPDFToImages(buffer);
          return await analyzeDocumentWithVision(images, fileName, prompt, chatId, res);
        }

        console.log(`[PDF] Text-Layer gefunden - normale Verarbeitung für "${fileName}"`);
        // Continue with normal text path below
        return await analyzeDocumentWithText(text, fileName, prompt, chatId, res);
      } catch (err: any) {
        console.error('[PDF] Error during PDF processing:', err);
        return next(createError(err.message || 'Fehler beim Lesen der PDF', 400));
      }
    }

    // Non-PDF files: extract text normally
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(buffer, mimeType, fileName);
    } catch (err: any) {
      return next(createError(err.message || 'Fehler beim Lesen der Datei', 400));
    }

    return await analyzeDocumentWithText(extractedText, fileName, prompt, chatId, res);
  } catch (error: any) {
    console.error('Document Analysis Error:', error);

    if (!res.headersSent) {
      return next(createError(error.message || 'Dokumentanalyse fehlgeschlagen', 500));
    }

    res.write(`data: ${JSON.stringify({ error: error.message || 'Ein Fehler ist aufgetreten' })}\n\n`);
    res.end();
  }
};

/**
 * Analyze document using text extraction (normal path)
 */
async function analyzeDocumentWithText(
  extractedText: string,
  fileName: string,
  prompt: string,
  chatId: string,
  res: Response
) {
  // Truncate if too long (GPT context limit)
  const maxChars = 100000;
  if (extractedText.length > maxChars) {
    extractedText = extractedText.slice(0, maxChars) + '\n\n[... Text gekürzt ...]';
  }

  const systemMessage = `Der Benutzer hat ein Dokument hochgeladen: "${fileName}"

Hier ist der extrahierte Inhalt des Dokuments:

---
${extractedText}
---

Beantworte die Fragen des Benutzers basierend auf diesem Dokumentinhalt.`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-5.2',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt || 'Was steht in diesem Dokument? Fasse den Inhalt zusammen.' },
    ],
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  // Save to database if chatId provided
  if (chatId && fullContent) {
    await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: fullContent,
      },
    });
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * Analyze scanned PDF using GPT Vision (image-based)
 */
async function analyzeDocumentWithVision(
  images: string[],
  fileName: string,
  prompt: string,
  chatId: string,
  res: Response
) {
  // Build image content for Vision API
  const imageContent = images.map((base64) => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/png;base64,${base64}` },
  }));

  const userPrompt = prompt || 'Analysiere dieses Dokument und fasse den Inhalt zusammen.';

  const stream = await openai.chat.completions.create({
    model: 'gpt-5.2',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Dokument: "${fileName}" (${images.length} Seite${images.length > 1 ? 'n' : ''})\n\n${userPrompt}`,
          },
          ...imageContent,
        ],
      },
    ],
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  // Save to database if chatId provided
  if (chatId && fullContent) {
    await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: fullContent,
      },
    });
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
