import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.

// Tenant-based navigation structure: { tenant_name: { role: NavItem[] } }
export type TenantNavItems = {
  [tenantName: string]: {
    [role: string]: NavItem[];
  };
};

export const tenantNavItems: TenantNavItems = {
 
  'Room Trading': {
    USER: [
      {
        title: 'Trade',
        url: '/trade',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Institutional',
        url: '/trading-view-room-institutional',
        icon: 'market',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Plans',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'Props',
        url: '/challenges',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
    
      {
        title: 'Account',
        url: '/user-management',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SELLER: [
      {
        title: 'Trade',
        url: '/trade',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Plans',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'Props',
        url: '/challenges',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Overview',
        url: '/dashboard',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Account',
        url: '/user-management',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    ADMIN: [
      {
          title: 'Trade',
        url: '/trade',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Institutional-User',
        url: '/trading-view-room-institutional',
        icon: 'market',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Institutional',
        url: '/admin/positions',
        icon: 'market',
        isActive: false,
        shortcut: ['m', 'm'],
        items: []
      },
      {
        title: 'Plans',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'Props',
        url: '/challenges',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Trade',
        url: '/dashboard',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Users',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Markets',
        url: '/admin/markets',
        icon: 'market',
        isActive: false,
        shortcut: ['l', 'm'],
        items: []
      },
      {
        title: 'Investments',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'KYC Requests',
        url: '/admin/kyc-requests',
        icon: 'user',
        isActive: false,
        shortcut: ['k', 'y'],
        items: []
      },
      {
        title: 'Account',
        url: '/user-management',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'Trade',
        url: '/trade',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Institutional-User',
        url: '/trading-view-room-institutional',
        icon: 'market',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Institutional',
        url: '/admin/positions',
        icon: 'market',
        isActive: false,
        shortcut: ['m', 'm'],
        items: []
      },
      {
        title: 'Plans',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'Props',
        url: '/challenges',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
    
      {
        title: 'Account',
        url: '/user-management',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      },
      {
        title: 'Users',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Markets',
        url: '/admin/markets',
        icon: 'market',
        isActive: false,
        shortcut: ['l', 'm'],
        items: []
      },
      {
        title: 'Investments',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Withdrawals',
        url: '/admin/withdraw-requests',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'r'],
        items: []
      },
      {
        title: 'KYC Requests',
        url: '/admin/kyc-requests',
        icon: 'user',
        isActive: false,
        shortcut: ['k', 'y'],
        items: []
      },
      {
        title: 'Settings',
        url: '/super-admin/app-settings',
        icon: 'settings',
        isActive: false,
        shortcut: ['a', 's'],
        items: []
      },
      {
        title: 'Theme',
        url: '/super-admin/theme-settings',
        icon: 'palette',
        isActive: false,
        shortcut: ['t', 's'],
        items: []
      }
    ]
  },


 
};

/** User-management area (PaySnap-style shell): sidebar links under `/user-management`. */
export type UserManagementNavItem = {
  title: string;
  url: string;
};

export const userManagementNavPrimary: UserManagementNavItem[] = [
  { title: 'Dashboard', url: '/user-management' },
  { title: 'Deposit', url: '/user-management/deposit' },
  { title: 'Transfer', url: '/user-management/transfer' },
  { title: 'Withdrawal', url: '/user-management/withdrawal' },
  { title: 'Settings', url: '/user-management/settings' },
  { title: 'KYC verification', url: '/user-management/kyc' }
];

export const userManagementNavSecondary: UserManagementNavItem[] = [];

// Legacy exports for backward compatibility (if needed elsewhere)
export const navItemsUser: NavItem[] =
  tenantNavItems['Room Trading']?.USER || [];
export const navItemsSeller: NavItem[] =
  tenantNavItems['Room Trading']?.SELLER || [];
export const navItemsAdmin: NavItem[] =
  tenantNavItems['Room Trading']?.ADMIN || [];
export const navItemsSuperAdmin: NavItem[] =
  tenantNavItems['Room Trading']?.SUPERADMIN || [];

export const navItems: NavItem[] = [
  ...navItemsUser,
  ...navItemsSeller,
  ...navItemsAdmin,
  ...navItemsSuperAdmin
];

export const externalApiLinks = {
  nowPaymentsInvoiceApi: 'https://api.nowpayments.io/v1/invoice'
} as const;

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
