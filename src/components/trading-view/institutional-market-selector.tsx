'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type MarketOption = {
  id: string;
  symbol: string;
  name: string;
};

interface InstitutionalMarketSelectorProps {
  markets: MarketOption[];
  selectedMarketId?: string;
}

export function InstitutionalMarketSelector({
  markets,
  selectedMarketId
}: InstitutionalMarketSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (markets.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedMarketId}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('pk', value);
        router.replace(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder='Select institutional market' />
      </SelectTrigger>
      <SelectContent>
        {markets.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.symbol} - {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
