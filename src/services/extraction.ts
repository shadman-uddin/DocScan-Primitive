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

export function generateMockExtraction(): ExtractionResponse {
  const mockRows = [
    { name: 'Amed Borges', id: '1677', timeIn: '6:00', timeOut: null },
    { name: 'Harrison Rivera', id: '2085', timeIn: '7:00', timeOut: null },
    { name: 'Luis Rodriguez', id: '2220', timeIn: '7:00', timeOut: null },
    { name: 'Cristian Ortiz', id: '731', timeIn: '7:00', timeOut: null },
    { name: 'Eduardo Rosa', id: '1146', timeIn: '7:00', timeOut: null },
  ];

  return {
    success: true,
    data: {
      headerFields: [
        { field_name: 'foreman_name', extracted_value: 'Amed', confidence: 0.95 },
        { field_name: 'date', extracted_value: '2026-02-16', confidence: 0.92 },
      ],
      rows: mockRows.map((row, idx) => ({
        row_index: idx,
        fields: [
          { field_name: 'worker_name', extracted_value: row.name, confidence: 0.88 },
          { field_name: 'worker_id', extracted_value: row.id, confidence: 0.90 },
          { field_name: 'time_in', extracted_value: row.timeIn, confidence: 0.85 },
          { field_name: 'time_out', extracted_value: row.timeOut, confidence: row.timeOut ? 0.8 : 0 },
        ],
      })),
      totalWorkers: mockRows.length,
      processingTime: 1200,
      model: 'mock-model',
    },
  };
}
