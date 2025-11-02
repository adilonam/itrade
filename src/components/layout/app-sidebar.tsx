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
import {
  navItemsUser,
  navItemsAdmin,
  navItemsSuperAdmin
} from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
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

  // Dynamic tenants based on user role
  const tenants = React.useMemo(() => {
    const baseTenants = [{ id: '1', name: 'Dashboard' }];

    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
      baseTenants.push({ id: '2', name: 'Admin' });
    }

    if (user?.role === 'SUPERADMIN') {
      baseTenants.push({ id: '3', name: 'Super Admin' });
    }

    return baseTenants;
  }, [user?.role]);

  // Track the selected tenant
  const [selectedTenant, setSelectedTenant] = React.useState(() => tenants[0]);

  // Update selected tenant when tenants change (e.g., when user role is loaded)
  React.useEffect(() => {
    if (!selectedTenant || !tenants.find((t) => t.id === selectedTenant.id)) {
      setSelectedTenant(tenants[0]);
    }
  }, [tenants, selectedTenant]);

  const handleSwitchTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
    }
  };

  React.useEffect(() => {
    // Auto-select tenant based on current path
    if (pathname.startsWith('/super-admin')) {
      const superAdminTenant = tenants.find((t) => t.id === '3');
      if (superAdminTenant) {
        setSelectedTenant(superAdminTenant); // Super Admin tenant
      }
    } else if (pathname.startsWith('/admin')) {
      const adminTenant = tenants.find((t) => t.id === '2');
      if (adminTenant) {
        setSelectedTenant(adminTenant); // Admin tenant
      }
    } else if (pathname.startsWith('/dashboard')) {
      const dashboardTenant = tenants.find((t) => t.id === '1');
      if (dashboardTenant) {
        setSelectedTenant(dashboardTenant); // Dashboard tenant
      }
    }
  }, [pathname, tenants]);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  const isLoading = status === 'loading' || !pathname || !user;

  // Get navigation items based on selected tenant
  const getNavItems = React.useMemo(() => {
    if (selectedTenant.id === '3') {
      // Super Admin tenant - show super admin items
      return navItemsSuperAdmin;
    } else if (selectedTenant.id === '2') {
      // Admin tenant - show admin items
      return navItemsAdmin;
    } else {
      // Dashboard tenant - show user items
      return navItemsUser;
    }
  }, [selectedTenant.id]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <AppBranding className='px-2 py-3' />
        {!isLoading && (
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
              getNavItems.map((item) => {
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
                          {item.items?.map((subItem) => (
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
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
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
