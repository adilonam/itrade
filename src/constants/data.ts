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
        title: 'Mes transaction',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messagerie',
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
        title: 'Toutes actualité confondus en fonction activation',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Liens Utiles',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messagerie',
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
        title: 'Toutes actualité confondus en fonction activation',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Liens Utiles',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messagerie',
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
        title: 'Toutes actualité confondus en fonction activation',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Liens Utiles',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'Messagerie',
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
        title: 'Toutes actualité confondus en fonction activation',
        url: '/news',
        icon: 'news',
        isActive: false,
        shortcut: ['n', 'w'],
        items: []
      },
      {
        title: 'Liens Utiles',
        url: '/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'Account',
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=trade',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=trade',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=trade',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=trade',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=trade',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=stock',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=stock',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=stock',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'Mes transaction',
        url: '/transactions?type=stock',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=stock',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'My Invest',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'Mes transaction',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=invest',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'My Invest',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'Mes transaction',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=invest',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'My Invest',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'Mes transaction',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=invest',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
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
        title: 'My Invest',
        url: '/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['m', 'i'],
        items: []
      },
      {
        title: 'Mes transaction',
        url: '/transactions?type=invest',
        icon: 'transaction',
        isActive: false,
        shortcut: ['t', 'r'],
        items: []
      },
      {
        title: 'actualité',
        url: '/news?type=invest',
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
        url: '#',
        icon: 'billing',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/profile',
            icon: 'userPen',
            shortcut: ['p', 'r']
          }
        ]
      }
    ]
  },
  Administration: {
    USER: [],
    SELLER: [
      {
        title: 'List Users',
        url: '/seller/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Positions',
        url: '/seller/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Stocks',
        url: '/seller/positions',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Investments',
        url: '/seller/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Accès Messagerie Centralisée',
        url: '/seller/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
        items: []
      }
    ],
    ADMIN: [
      {
        title: 'List Users',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Seller',
        url: '/admin/sellers',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Positions',
        url: '/admin/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Stocks',
        url: '/admin/positions',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Investments',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'List Actualité',
        url: '/admin/news',
        icon: 'news',
        isActive: false,
        shortcut: ['l', 'a'],
        items: []
      },
      {
        title: 'List Liens utiles',
        url: '/admin/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      },
      {
        title: 'Accès Messagerie Centralisée',
        url: '/admin/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
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
        title: 'List Users',
        url: '/admin/users',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 'u'],
        items: []
      },
      {
        title: 'List Seller',
        url: '/admin/sellers',
        icon: 'user',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Positions',
        url: '/admin/positions',
        icon: 'switchVertical',
        isActive: false,
        shortcut: ['l', 'p'],
        items: []
      },
      {
        title: 'List Stocks',
        url: '/admin/stocks',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['l', 's'],
        items: []
      },
      {
        title: 'List Investments',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'List Actualité',
        url: '/admin/news',
        icon: 'news',
        isActive: false,
        shortcut: ['l', 'a'],
        items: []
      },
      {
        title: 'List Liens utiles',
        url: '/admin/useful-links',
        icon: 'link',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      },
      {
        title: 'Accès Messagerie Centralisée',
        url: '/admin/messages',
        icon: 'message',
        isActive: false,
        shortcut: ['a', 'm'],
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
        title: 'Config serveur mail pour 2FA',
        url: '/super-admin/mail-config',
        icon: 'server',
        isActive: false,
        shortcut: ['m', 'c'],
        items: []
      },
      {
        title: 'Mode DEBUG',
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
