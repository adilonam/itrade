import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { InvestmentEnrollmentForm } from '@/components/investments/investment-enrollment-form';
import PageContainer from '@/components/layout/page-container';
import { prisma } from '@/lib/prisma';

interface InvestmentPageProps {
  params: Promise<{ id: string }>;
}

async function getInvestment(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/investments/${id}`,
      {
        cache: 'no-store' // Ensure fresh data
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Investment not found
      }
      throw new Error('Failed to fetch investment');
    }

    const investment = await response.json();
    return investment;
  } catch (error) {
    return null; // Return null if error occurs
  }
}

async function getUserBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return (user as any)?.balance || 0;
  } catch (error) {
    // Return fallback value if error occurs
    return 0;
  }
}

export default async function InvestmentPage({ params }: InvestmentPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return redirect('/auth/sign-in');
  }

  const investment = await getInvestment(id);

  if (!investment) {
    return notFound();
  }

  const userBalance = await getUserBalance(session.user.id);

  return (
    <PageContainer>
      <div className='space-y-6'>
        <InvestmentEnrollmentForm
          investment={investment}
          userBalance={userBalance}
        />
      </div>
    </PageContainer>
  );
}
