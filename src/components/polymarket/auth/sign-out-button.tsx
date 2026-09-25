'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/polymarket/ui/button';
import { POLYMARKET_BASE } from '@/lib/polymarket/paths';

export function SignOutButton() {
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={() => signOut({ callbackUrl: POLYMARKET_BASE })}
    >
      Sign out
    </Button>
  );
}
