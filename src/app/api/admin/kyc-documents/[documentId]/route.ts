import { BlobError, get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getBlobPutOptions } from '@/lib/blob-upload';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

function accessForBlobUrl(fileUrl: string): 'private' | 'public' {
  try {
    const { hostname } = new URL(fileUrl);
    if (hostname.includes('.private.blob.vercel-storage.com')) {
      return 'private';
    }
    return 'public';
  } catch {
    return 'private';
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { documentId } = await params;

    const doc = await prisma.kycVerificationDocument.findUnique({
      where: { id: documentId },
      select: { fileUrl: true }
    });

    if (!doc?.fileUrl) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const blobOpts = await getBlobPutOptions();
    const result = await get(doc.fileUrl, {
      access: accessForBlobUrl(doc.fileUrl),
      ...blobOpts
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', result.blob.contentType);
    if (result.blob.contentDisposition) {
      headers.set('Content-Disposition', result.blob.contentDisposition);
    }
    headers.set('Cache-Control', 'private, no-store');

    return new NextResponse(result.stream, { status: 200, headers });
  } catch (error) {
    if (error instanceof BlobError) {
      return NextResponse.json({ error: 'Blob unavailable' }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Failed to load document' },
      { status: 500 }
    );
  }
}
