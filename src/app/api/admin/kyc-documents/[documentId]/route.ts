import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
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
      select: {
        fileContent: true,
        contentType: true,
        fileName: true
      }
    });

    if (!doc?.fileContent?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', doc.contentType);
    if (doc.fileName) {
      headers.set(
        'Content-Disposition',
        `inline; filename="${doc.fileName.replace(/"/g, '')}"`
      );
    }
    headers.set('Cache-Control', 'private, no-store');

    return new NextResponse(new Uint8Array(doc.fileContent), {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load document' },
      { status: 500 }
    );
  }
}
