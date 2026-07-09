import { randomUUID } from 'crypto';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export function isAllowedImageMimeType(mimetype: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimetype);
}

export function buildUploadFilename(mimetype: string): string {
  const extension = MIME_TO_EXTENSION[mimetype];

  if (!extension) {
    throw new Error(`Unsupported mimetype: ${mimetype}`);
  }

  return `${randomUUID()}${extension}`;
}
