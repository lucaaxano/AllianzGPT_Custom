// Use legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';

// Disable worker for Node.js environment
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '';

/**
 * Custom CanvasFactory for Node.js environment
 * Required because pdfjs-dist needs to know how to create canvas objects in Node.js
 */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

/**
 * Convert PDF pages to Base64 PNG images
 */
export async function convertPDFToImages(buffer: Buffer): Promise<string[]> {
  const uint8Array = new Uint8Array(buffer);
  const canvasFactory = new NodeCanvasFactory();

  const pdf = await (pdfjsLib as any).getDocument({
    data: uint8Array,
    canvasFactory,
  }).promise;

  const images: string[] = [];

  // Limit to first 15 pages to avoid API limits
  const maxPages = Math.min(pdf.numPages, 15);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    // Scale 1.5 for good quality without being too large
    const viewport = page.getViewport({ scale: 1.5 });

    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

    // Render page to canvas
    await page.render({
      canvasContext: canvasAndContext.context,
      viewport,
    }).promise;

    // Convert to Base64 PNG
    const dataUrl = canvasAndContext.canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    images.push(base64);
  }

  return images;
}

/**
 * Check if PDF is scanned (no/little text layer)
 */
export function isScannedPDF(text: string, pageCount: number): boolean {
  if (pageCount === 0) return true;

  // Remove whitespace and calculate average chars per page
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const avgCharsPerPage = cleanText.length / pageCount;

  // Less than 100 chars per page = likely scanned
  // This threshold catches most scanned PDFs while allowing PDFs with minimal text
  return avgCharsPerPage < 100;
}

/**
 * Get PDF page count
 */
export async function getPDFPageCount(buffer: Buffer): Promise<number> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  return pdf.numPages;
}
