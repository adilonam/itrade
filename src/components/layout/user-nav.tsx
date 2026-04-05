'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useWatchTraderPortalContainer } from '@/contexts/watch-trader-portal-context';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function UserNav({ variant = 'default' }: { variant?: 'default' | 'trade' }) {
  const { data: session } = useSession();
  const router = useRouter();
  const tradePortalContainer = useWatchTraderPortalContainer();
  const isTrade = variant === 'trade';

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <UserAvatarProfile user={session.user} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            'w-56',
            isTrade &&
              'border-trade-border bg-trade-panel p-1 font-sans text-xs text-trade-text shadow-lg'
          )}
          align='end'
          sideOffset={10}
          forceMount
          container={isTrade ? (tradePortalContainer ?? undefined) : undefined}
        >
          <DropdownMenuLabel
            className={cn(
              'font-normal',
              isTrade && 'px-2 py-1.5 text-xs font-medium text-trade-text'
            )}
          >
            <div className='flex flex-col gap-1'>
              <p
                className={cn(
                  'leading-none font-medium',
                  isTrade ? 'text-xs' : 'text-sm'
                )}
              >
                {session.user.name}
                {session.user.role && session.user.role !== 'USER' && (
                  <span
                    className={cn(
                      'ml-2',
                      isTrade ? 'text-trade-green' : 'text-green-600'
                    )}
                  >
                    {session.user.role}
                  </span>
                )}
              </p>
              <p
                className={cn(
                  'leading-none',
                  isTrade ? 'text-trade-text-muted' : 'text-muted-foreground text-xs'
                )}
              >
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator
            className={isTrade ? 'bg-trade-border' : undefined}
          />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className={cn(
                isTrade &&
                  'text-xs focus:bg-trade-dark focus:text-trade-text'
              )}
              onClick={() => router.push('/user-management')}
            >
              Profile
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator
            className={isTrade ? 'bg-trade-border' : undefined}
          />
          <DropdownMenuItem
            className={cn(
              isTrade &&
                'text-xs focus:bg-trade-dark focus:text-trade-text'
            )}
            onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
