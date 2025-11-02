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

// User navigation items (regular users)
export const navItemsUser: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    isAdmin: false
  },
  {
    title: 'Room Trading',
    url: '/dashboard/markets-room-trading',
    icon: 'trendingUp',
    isActive: false,
    shortcut: ['r', 't'],
    items: [],
    isAdmin: false
  },
  {
    title: 'Room Stock',
    url: '/dashboard/markets-room-stock',
    icon: 'trendingUp',
    isActive: false,
    shortcut: ['s', 's'],
    items: [],
    isAdmin: false
  },
  {
    title: 'My Positions',
    url: '/dashboard/positions-room-trading',
    icon: 'switchVertical',
    isActive: false,
    shortcut: ['m', 'r'],
    items: [],
    isAdmin: false
  },
  {
    title: 'My Portfolio',
    url: '/dashboard/positions-room-stock',
    icon: 'switchVertical',
    isActive: false,
    shortcut: ['m', 't'],
    items: [],
    isAdmin: false
  },
  {
    title: 'Investments',
    url: '/dashboard/investments',
    icon: 'pigMoney',
    isActive: false,
    shortcut: ['i', 'v'],
    items: [],
    isAdmin: false
  },
  {
    title: 'Account',
    url: '#',
    icon: 'billing',
    isActive: true,
    isAdmin: false,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm'],
        isAdmin: false
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login',
        isAdmin: false
      }
    ]
  }
];

// Admin navigation items (for ADMIN role)
export const navItemsAdmin: NavItem[] = [
  {
    title: 'Users',
    url: '/admin/users',
    icon: 'user',
    isActive: false,
    shortcut: ['u', 'u'],
    items: [],
    isAdmin: true
  },
  {
    title: 'Markets',
    url: '/admin/markets',
    icon: 'market',
    isActive: false,
    shortcut: ['a', 'm'],
    items: [],
    isAdmin: true
  },
  {
    title: 'Investments',
    url: '/admin/investments',
    icon: 'pigMoney',
    isActive: false,
    shortcut: ['a', 'i'],
    items: [],
    isAdmin: true
  },
  {
    title: 'Positions',
    url: '/admin/positions',
    icon: 'switchVertical',
    isActive: false,
    shortcut: ['t', 't'],
    items: [],
    isAdmin: true
  }
];

// Super Admin navigation items (for SUPERADMIN role)
export const navItemsSuperAdmin: NavItem[] = [
  {
    title: 'App Settings',
    url: '/super-admin/app-settings',
    icon: 'settings',
    isActive: false,
    shortcut: ['s', 'a'],
    items: [],
    isAdmin: true,
    isSuperAdmin: true
  },
  {
    title: 'Theme Settings',
    url: '/super-admin/theme-settings',
    icon: 'palette',
    isActive: false,
    shortcut: ['t', 's'],
    items: [],
    isAdmin: true,
    isSuperAdmin: true
  }
];

// Legacy export for backward compatibility (if needed elsewhere)
export const navItems: NavItem[] = [
  ...navItemsUser,
  ...navItemsAdmin,
  ...navItemsSuperAdmin
];

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
