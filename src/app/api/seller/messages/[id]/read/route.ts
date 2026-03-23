import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Helper function to check seller permissions
async function checkSellerPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true }
  });

  if (
    !user ||
    (user.role !== 'SELLER' &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN')
  ) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

// PATCH - Mark a message as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { id } = await params;
    const sellerId = permissionCheck.user!.id;

    // Find message and verify seller is receiver
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

    // Verify seller is receiver
    if (message.receiverId !== sellerId) {
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
