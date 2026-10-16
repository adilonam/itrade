import { ConsentPage } from '@/components/consent/consent-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading consent',
  description: 'Digitally sign the trading risk consent'
};

export default function ConsentRoutePage() {
  return <ConsentPage />;
}
