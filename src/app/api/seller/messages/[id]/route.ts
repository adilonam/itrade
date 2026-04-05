import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

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

// DELETE - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { id } = await params;
    const sellerId = permissionCheck.user!.id;

    // Find message and verify seller is sender or receiver
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
        receiverId: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify seller is sender or receiver
    if (message.senderId !== sellerId && message.receiverId !== sellerId) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Delete message
    await prisma.message.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
