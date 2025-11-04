import { RecentSales } from '@/features/overview/components/recent-sales';
import { delay } from '@/lib/utils';

export default async function Sales() {
  await await delay(3000);
  return <RecentSales />;
}
