import type { Prisma } from '@/lib/prisma/generated/client';

export type KycFilePayload = {
  fileContent: Prisma.Bytes;
  contentType: string;
  fileName: string;
};

export async function fileToKycPayload(file: File): Promise<KycFilePayload> {
  const arrayBuffer = await file.arrayBuffer();
  const contentType =
    file.type.trim() || guessContentTypeFromName(file.name) || 'application/octet-stream';

  return {
    fileContent: new Uint8Array(arrayBuffer.slice(0)) as Prisma.Bytes,
    contentType,
    fileName: file.name.trim() || 'document'
  };
}

function guessContentTypeFromName(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    default:
      return null;
  }
}
