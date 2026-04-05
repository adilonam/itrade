import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type Action = 'pause' | 'stop' | 'resume';

/**
 * PATCH /api/user/bot-trading/[id]
 * Body: { action: 'pause' | 'stop' | 'resume' }
 * - pause: sets active to false
 * - stop: sets dateStop to now and active to false
 * - resume: sets active to true (only when paused)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action as Action | undefined;

    if (!action || !['pause', 'stop', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid or missing action. Must be "pause", "stop", or "resume".' },
        { status: 400 }
      );
    }

    const existing = await prisma.botUser.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bot not found.' }, { status: 404 });
    }

    const botUser =
      action === 'pause'
        ? await prisma.botUser.update({
            where: { id },
            data: { active: false },
            include: { market: true }
          })
        : action === 'stop'
          ? await prisma.botUser.update({
              where: { id },
              data: { dateStop: new Date(), active: false },
              include: { market: true }
            })
          : await prisma.botUser.update({
              where: { id },
              data: { active: true },
              include: { market: true }
            });

    return NextResponse.json({ botUser });
  } catch (e) {
    console.error('PATCH /api/user/bot-trading/[id]', e);
    return NextResponse.json(
      { error: 'Failed to update bot.' },
      { status: 500 }
    );
  }
}
