import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

export default async function Dashboard() {
  const session = await getAuthSession();

  if (!session) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/admin/users');
  }
}
