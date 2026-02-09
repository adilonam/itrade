import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/files/[id]
 * Serve file content by File id. Path in DB is relative to public (e.g. /uploads/xxx.jpg).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // path is stored as e.g. /uploads/filename.jpg (relative to public)
    const pathInPublic = file.path.replace(/^\//, '');
    const fullPath = join(process.cwd(), 'public', pathInPublic);

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }

    const buffer = await readFile(fullPath);
    const mimeType = file.mimeType ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=31536000'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
