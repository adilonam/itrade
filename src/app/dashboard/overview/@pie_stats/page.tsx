import { PieGraph } from '@/features/overview/components/pie-graph';
import { delay } from '@/lib/utils';

export default async function Stats() {
  await delay(1000);
  return <PieGraph />;
}
