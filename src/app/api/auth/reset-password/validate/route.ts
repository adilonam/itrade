import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true } } }
    });

    if (
      !record ||
      record.used ||
      record.expiresAt < new Date()
    ) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      email: record.user.email
    });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
