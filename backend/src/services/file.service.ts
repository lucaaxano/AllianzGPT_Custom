import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Disable worker for Node.js environment
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from PDF and return page count using pdfjs-dist
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await (pdfjsLib as any).getDocument({ data: uint8Array }).promise;

  let fullText = '';
  const pageCount = pdf.numPages;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return {
    text: fullText,
    pageCount,
  };
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  // PDF - using pdf-parse v2 API
  if (mimeType === 'application/pdf') {
    const { text } = await extractTextFromPDF(buffer);
    return text;
  }

  // Word DOCX
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Excel XLSX
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      text += `--- Sheet: ${name} ---\n`;
      text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
    });
    return text;
  }

  // PowerPoint PPTX (extract basic text)
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    // PPTX is a zip, we'll just note it's not fully supported
    return `[PowerPoint-Datei: ${filename}] - Vollständige Textextraktion nicht verfügbar. Bitte beschreiben Sie, was Sie wissen möchten.`;
  }

  // CSV
  if (mimeType === 'text/csv') {
    return buffer.toString('utf-8');
  }

  // Plain text, JSON, Markdown
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json'
  ) {
    return buffer.toString('utf-8');
  }

  throw new Error(`Nicht unterstützter Dateityp: ${mimeType}`);
}

export function getFileSizeInMB(base64: string): number {
  // Base64 is about 4/3 larger than binary
  const bytes = (base64.length * 3) / 4;
  return bytes / (1024 * 1024);
}

export const MAX_FILE_SIZE_MB = 20;
