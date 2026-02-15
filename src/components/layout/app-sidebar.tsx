'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { tenantNavItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { NavItem } from '@/types';
import { useSession, signOut } from 'next-auth/react';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { AppBranding } from './app-branding';

export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  // Dynamic tenants - get from data.ts and filter based on user role
  // Only show tenants that have navigation items for the current user role
  const tenants = React.useMemo(() => {
    if (!user?.role) {
      return [];
    }

    const userRole = user.role as 'USER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN';
    const tenantNames = Object.keys(tenantNavItems);

    return tenantNames
      .map((name, index) => ({
        id: String(index + 1),
        name
      }))
      .filter((tenant) => {
        const tenantData = tenantNavItems[tenant.name];
        if (!tenantData) {
          return false;
        }
        const navItems = tenantData[userRole] || [];
        // Only include tenant if it has navigation items for this role
        return navItems.length > 0;
      });
  }, [user?.role]);

  // Track the selected tenant
  const [selectedTenant, setSelectedTenant] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Update selected tenant when tenants change (e.g., when user role is loaded)
  React.useEffect(() => {
    if (tenants.length > 0) {
      // If no tenant is selected or current tenant is not in the list, select the first one
      if (!selectedTenant || !tenants.find((t) => t.id === selectedTenant.id)) {
        setSelectedTenant(tenants[0]);
      }
    } else {
      // If no tenants available, clear selection
      setSelectedTenant(null);
    }
  }, [tenants, selectedTenant]);

  const handleSwitchTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      // Navigate to the first nav item of the selected tenant for current user role
      if (user?.role) {
        const userRole = user.role as
          | 'USER'
          | 'SELLER'
          | 'ADMIN'
          | 'SUPERADMIN';
        const tenantData = tenantNavItems[tenant.name];
        const navItems = tenantData?.[userRole] ?? [];
        const firstItem = navItems[0];
        if (firstItem?.url) {
          router.push(firstItem.url);
        }
      }
    }
  };

  React.useEffect(() => {
    // Auto-select tenant based on current path
    if (pathname.startsWith('/super-admin')) {
      const configTenant = tenants.find((t) => t.name === 'Configuration');
      if (configTenant) {
        setSelectedTenant(configTenant);
      }
    } else if (pathname.startsWith('/admin')) {
      const adminTenant = tenants.find((t) => t.name === 'Administration');
      if (adminTenant) {
        setSelectedTenant(adminTenant);
      }
    } else if (pathname.startsWith('/seller')) {
      const adminTenant = tenants.find((t) => t.name === 'Administration');
      if (adminTenant) {
        setSelectedTenant(adminTenant);
      }
    } else if (
      pathname.includes('/markets-room-trading') ||
      pathname.includes('/positions-room-trading')
    ) {
      const roomTradingTenant = tenants.find((t) => t.name === 'Room Trading');
      if (roomTradingTenant) {
        setSelectedTenant(roomTradingTenant);
      }
    } else if (
      pathname.includes('/markets-room-stock') ||
      pathname.includes('/positions-room-stock')
    ) {
      const roomStockTenant = tenants.find((t) => t.name === 'Room Stock');
      if (roomStockTenant) {
        setSelectedTenant(roomStockTenant);
      }
    } else if (pathname.includes('/investments')) {
      const investTenant = tenants.find((t) => t.name === 'Invest');
      if (investTenant) {
        setSelectedTenant(investTenant);
      }
    } else if (pathname.startsWith('/dashboard')) {
      const dashboardTenant = tenants.find((t) => t.name === 'Dashboard');
      if (dashboardTenant) {
        setSelectedTenant(dashboardTenant);
      }
    }
  }, [pathname, tenants]);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  const isLoading = status === 'loading' || !pathname || !user;

  // Get navigation items based on selected tenant and user role
  const getNavItems = React.useMemo(() => {
    if (!selectedTenant || !user?.role) {
      return [];
    }

    const tenantName = selectedTenant.name;
    const userRole = user.role as 'USER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN';

    // Get nav items for the selected tenant and user role
    const tenantData = tenantNavItems[tenantName];
    if (!tenantData) {
      return [];
    }

    return tenantData[userRole] || [];
  }, [selectedTenant, user?.role]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <AppBranding className='px-2 py-3' />
        {!isLoading && selectedTenant && (
          <OrgSwitcher
            tenants={tenants}
            selectedTenant={selectedTenant}
            onTenantSwitch={handleSwitchTenant}
          />
        )}
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600'></div>
              </div>
            ) : (
              getNavItems.map((item: NavItem) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname === item.url}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem: NavItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
                >
                  <IconLogout className='mr-2 h-4 w-4' />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
