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
  Dashboard: {
    USER: [
      {
        title: 'Overview',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messages',
        url: '/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['m', 's'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Useful Links',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SELLER: [
      {
        title: 'Overview',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messages',
        url: '/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['m', 's'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Useful Links',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'Overview',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messages',
        url: '/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['m', 's'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Useful Links',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'Overview',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messages',
        url: '/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['m', 's'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Useful Links',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ]
  },
  'Room Trading': {
    USER: [
      {
        title: 'Dashboard',
        url: '/markets-room-trading',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Positions',
        url: '/positions-room-trading',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SELLER: [
      {
        title: 'Dashboard',
        url: '/markets-room-trading',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Positions',
        url: '/positions-room-trading',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'Dashboard',
        url: '/markets-room-trading',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Positions',
        url: '/positions-room-trading',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'Dashboard',
        url: '/markets-room-trading',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Positions',
        url: '/positions-room-trading',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ]
  },
  'Room Stock': {
    USER: [
      {
        title: 'Dashboard',
        url: '/markets-room-stock',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Portfolio',
        url: '/positions-room-stock',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SELLER: [
      {
        title: 'Dashboard',
        url: '/markets-room-stock',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Portfolio',
        url: '/positions-room-stock',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'Dashboard',
        url: '/markets-room-stock',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Portfolio',
        url: '/positions-room-stock',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'Dashboard',
        url: '/markets-room-stock',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Portfolio',
        url: '/positions-room-stock',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['m', 'p'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ]
  },
  Invest: {
    USER: [
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Investments',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SELLER: [
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Investments',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Investments',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'Dashboard',
        url: '/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'My Investments',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'My Transactions',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'News',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Withdraw',
        url: '/withdraw',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'd'],
        items: []
      },
      {
        title: 'Deposit',
        url: '/deposit',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'p'],
        items: []
      },
      {
        title: 'Account',
        url: '/profile',
        icon: 'billing',
        isActive: false,
        shortcut: ['p', 'r'],
        items: []
      }
    ]
  },
  Administration: {
    USER: [],
    SELLER: [
      {
        title: 'List Users (Seller)',
        url: '/seller/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Positions (Seller)',
        url: '/seller/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Investments (Seller)',
        url: '/seller/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Messages (Seller)',
        url: '/seller/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'List Users (Admin)',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Users (Seller)',
        url: '/seller/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Markets',
        url: '/admin/markets',
        icon: 'market',
        isActive: false,
        shortcut: ['l', 'm'],
        items: []
      },
      {
        title: 'List Positions (Admin)',
        url: '/admin/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Positions (Seller)',
        url: '/seller/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Investments (Admin)',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'List Investments (Seller)',
        url: '/seller/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Messages (Seller)',
        url: '/seller/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
        items: []
      },
      {
        title: 'List News',
        url: '/admin/news',
        icon: 'news',
        isActive: false,
        shortcut: ['l', 'a'],
        items: []
      },
      {
        title: 'List Useful Links',
        url: '/admin/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      },
      {
        title: 'Theme Settings',
        url: '/admin/theme-settings',
        icon: 'palette',
        isActive: false,
        shortcut: ['t', 's'],
        items: []
      }
    ],
    SUPERADMIN: [
      {
        title: 'List Users (Admin)',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Users (Seller)',
        url: '/seller/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Markets',
        url: '/admin/markets',
        icon: 'market',
        isActive: false,
        shortcut: ['l', 'm'],
        items: []
      },
      {
        title: 'List Positions (Admin)',
        url: '/admin/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Positions (Seller)',
        url: '/seller/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Investments (Admin)',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'List Investments (Seller)',
        url: '/seller/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Messages (Seller)',
        url: '/seller/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
        items: []
      },
      {
        title: 'List News',
        url: '/admin/news',
        icon: 'news',
        isActive: false,
        shortcut: ['l', 'a'],
        items: []
      },
      {
        title: 'List Useful Links',
        url: '/admin/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      }
    ]
  },
  Configuration: {
    USER: [],
    SELLER: [],
    ADMIN: [],
    SUPERADMIN: [
      {
        title: 'App Settings',
        url: '/super-admin/app-settings',
        icon: 'settings',
        isActive: false,
        shortcut: ['a', 's'],
        items: []
      },
      {
        title: 'Theme Settings',
        url: '/super-admin/theme-settings',
        icon: 'palette',
        isActive: false,
        shortcut: ['t', 's'],
        items: []
      },
      {
        title: 'Mail server config for 2FA',
        url: '/super-admin/mail-config',
        icon: 'server',
        isActive: false,
        shortcut: ['m', 'c'],
        items: []
      },
      {
        title: 'Debug Mode',
        url: '/super-admin/debug',
        icon: 'settings',
        isActive: false,
        shortcut: ['d', 'b'],
        items: []
      },
      {
        title: 'Save',
        url: '/super-admin/save',
        icon: 'check',
        isActive: false,
        shortcut: ['s', 'v'],
        items: []
      }
    ]
  }
};

// Legacy exports for backward compatibility (if needed elsewhere)
export const navItemsUser: NavItem[] = tenantNavItems['Dashboard'].USER || [];
export const navItemsSeller: NavItem[] =
  tenantNavItems['Administration'].SELLER || [];
export const navItemsAdmin: NavItem[] =
  tenantNavItems['Administration'].ADMIN || [];
export const navItemsSuperAdmin: NavItem[] =
  tenantNavItems['Configuration'].SUPERADMIN || [];

export const navItems: NavItem[] = [
  ...navItemsUser,
  ...navItemsSeller,
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
