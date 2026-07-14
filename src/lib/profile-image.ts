import type { Prisma } from '@/lib/prisma/generated/client';

type UserProfileImageFields = {
  id: string;
  image?: string | null;
  profileImageContent?: { length: number } | null;
  profileImageContentType?: string | null;
};

export type ProfileImagePayload = {
  profileImageContent: Prisma.Bytes;
  profileImageContentType: string;
  profileImageFileName: string;
};

export async function fileToProfileImagePayload(
  file: File
): Promise<ProfileImagePayload> {
  const arrayBuffer = await file.arrayBuffer();
  const contentType =
    file.type.trim() || guessProfileImageContentType(file.name);

  if (!contentType?.startsWith('image/')) {
    throw new Error('Profile image must be an image file.');
  }

  return {
    profileImageContent: new Uint8Array(arrayBuffer.slice(0)) as Prisma.Bytes,
    profileImageContentType: contentType,
    profileImageFileName: file.name.trim() || 'profile-image'
  };
}

export function getProfileImageUrl(
  user: UserProfileImageFields
): string | null {
  if (user.profileImageContent || user.profileImageContentType) {
    return `/api/user/profile-images/${user.id}`;
  }

  return user.image ?? null;
}

function guessProfileImageContentType(name: string): string | null {
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
    default:
      return null;
  }
}
