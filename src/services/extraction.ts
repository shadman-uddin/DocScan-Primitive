import heic2any from 'heic2any';
import { extractFromImage } from './api';
import type { ExtractionResponse } from './api';
import { generatePdfThumbnail } from '../utils/pdfThumbnail';

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const outputBlob = Array.isArray(blob) ? blob[0] : blob;
  return new File([outputBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
}

function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  );
}

async function resizeImage(file: File, maxSize: number = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function processAndExtract(
  file: File,
  fieldDefinitions: Array<{ name: string; label: string; type: string }>
): Promise<ExtractionResponse> {
  try {
    let base64Image: string;
    let effectiveMimeType: string;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      base64Image = await generatePdfThumbnail(file);
      effectiveMimeType = 'image/jpeg';
    } else if (isHeicFile(file)) {
      const jpegFile = await convertHeicToJpeg(file);
      base64Image = await resizeImage(jpegFile);
      effectiveMimeType = 'image/jpeg';
    } else if (file.type.startsWith('image/') && VALID_MIME_TYPES.includes(file.type)) {
      try {
        base64Image = await resizeImage(file);
      } catch (error) {
        console.warn('Failed to resize image, using original:', error);
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
      effectiveMimeType = file.type;
    } else {
      throw new Error('Unsupported file type');
    }

    return await extractFromImage(base64Image, effectiveMimeType, fieldDefinitions);
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unknown error occurred during extraction',
    };
  }
}

export function generateMockExtraction(
  fieldDefinitions: Array<{ name: string; label: string; type: string }>
): ExtractionResponse {
  const mockValues: Record<string, string> = {
    worker_name: 'John Smith',
    worker_id: 'WK-' + Math.floor(Math.random() * 10000),
    foreman: 'Mike Johnson',
    entry_date: new Date().toISOString().split('T')[0],
  };

  const fields = fieldDefinitions.map((field) => ({
    field_name: field.name,
    extracted_value: mockValues[field.name] || null,
    confidence: Math.random() * 0.4 + 0.6,
  }));

  return {
    success: true,
    data: {
      fields,
      processingTime: Math.floor(Math.random() * 1000) + 500,
      model: 'mock-model',
    },
  };
}
