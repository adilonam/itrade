import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserBalance } from '@/lib/balance';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (e.g., cron job or Vercel)
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    const isAuthorizedCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isVercelCron = vercelCronHeader === '1';

    if (!isAuthorizedCron && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all active investments that have reached their end date
    const maturedInvestments = await prisma.userInvestment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      },
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            country: true,
            currentCapacity: true
          }
        }
      }
    });

    // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
    console.log(
      `Found ${maturedInvestments.length} matured investments to process`
    );

    let completedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each matured investment
    for (const userInvestment of maturedInvestments) {
      try {
        await prisma.$transaction(async (tx) => {
          // Calculate total return (principal + gains)
          const totalReturn =
            userInvestment.amount + userInvestment.expectedReturn;

          // Update user investment status
          await tx.userInvestment.update({
            where: { id: userInvestment.id },
            data: {
              status: 'COMPLETED',
              actualReturn: userInvestment.expectedReturn,
              completedAt: now
            }
          });

          // Return funds to REAL balance
          const userBalance = await ensureUserBalance(
            tx,
            userInvestment.userId,
            'REAL'
          );
          await tx.userBalance.update({
            where: { userId_type: { userId: userInvestment.userId, type: 'REAL' } },
            data: {
              amount: userBalance.amount + totalReturn
            }
          });

          // Create transaction record for investment return (principal)
          await tx.transaction.create({
            data: {
              userId: userInvestment.userId,
              balanceType: 'REAL',
              type: 'DEPOSIT',
              absoluteAmount: userInvestment.amount,
              description: `Investment matured: ${userInvestment.investment.title} - Principal returned`
            }
          });

          // Create transaction record for investment gains
          if (userInvestment.expectedReturn > 0) {
            await tx.transaction.create({
              data: {
                userId: userInvestment.userId,
                balanceType: 'REAL',
                type: 'GAIN',
                absoluteAmount: userInvestment.expectedReturn,
                description: `Investment return: ${userInvestment.investment.title} - ${userInvestment.investment.country}`
              }
            });
          }

          // Update investment current capacity (reduce by the amount that was invested)
          await tx.investment.update({
            where: { id: userInvestment.investment.id },
            data: {
              currentCapacity: Math.max(
                0,
                userInvestment.investment.currentCapacity -
                  userInvestment.amount
              )
            }
          }          );

          // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
          console.log(
            `Completed investment ${userInvestment.id} for user ${userInvestment.userId}: ` +
              `Principal: ${userInvestment.amount}, Return: ${userInvestment.expectedReturn}, Total: ${totalReturn}`
          );
        });

        completedCount++;
      } catch (error) {
        failedCount++;
        const errorMessage = `Failed to process investment ${userInvestment.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMessage);
        // eslint-disable-next-line no-console -- intentional error logging for cron job
        console.error(errorMessage);
      }
    }

    // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
    console.log(
      `Investment maturity processing completed: ${completedCount} completed, ${failedCount} failed`
    );

    return NextResponse.json({
      message: 'Investment maturity processing completed',
      completed: completedCount,
      failed: failedCount,
      total: maturedInvestments.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- intentional error logging in API route
    console.error('Error in mature-investments schedule:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
