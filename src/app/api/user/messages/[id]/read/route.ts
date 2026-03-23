import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Find message and verify user is receiver
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        receiverId: true,
        read: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is receiver
    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: 'You can only mark messages you received as read' },
        { status: 403 }
      );
    }

    // If already read, return success
    if (message.read) {
      return NextResponse.json({ success: true, message: 'Already read' });
    }

    // Mark message as read
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { read: true },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
