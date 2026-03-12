import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/trade');
  }
}
