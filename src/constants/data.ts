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
        title: 'Portfolio',
        url: '/portfolio',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['p', 'o'],
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
        title: 'Portfolio',
        url: '/portfolio',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['p', 'o'],
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
        title: 'Portfolio',
        url: '/portfolio',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['p', 'o'],
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
        title: 'Client Positions',
        url: '/admin/positions',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['c', 'p'],
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
        title: 'Investments-admin',
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
        title: 'Deposit request',
        url: '/admin/deposit-request',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'r'],
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
        title: 'Portfolio',
        url: '/portfolio',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['p', 'o'],
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
        title: 'Client Positions',
        url: '/admin/positions',
        icon: 'portfolio',
        isActive: false,
        shortcut: ['c', 'p'],
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
        title: 'Investments-admin',
        url: '/admin/investments',
        icon: 'pigMoney',
        isActive: false,
        shortcut: ['l', 'i'],
        items: []
      },
      {
        title: 'Withdrawals request',
        url: '/admin/withdraw-requests',
        icon: 'minus',
        isActive: false,
        shortcut: ['w', 'r'],
        items: []
      },
      {
        title: 'Deposit request',
        url: '/admin/deposit-request',
        icon: 'add',
        isActive: false,
        shortcut: ['d', 'r'],
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

export const landingPageLinks = {
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  trade: '/trade',
  plans: '/investments',
  dashboard: '/overview'
} as const;

export const landingNavLinks = {
  markets: '/trade',
  learning: '/auth/sign-in',
  account: '/auth/sign-in',
  support: '/auth/sign-in'
} as const;

/** Landing placeholder links (replace with real routes when ready). */
export const landingPlaceholderLink = '#' as const;

export const landingSiteLinks = {
  base: landingPlaceholderLink,
  legal: '/legal',
  aboutUs: '/about-us',
  contactUs: '/contact-us',
  liveChat: landingPlaceholderLink,
  education: landingPlaceholderLink,
  economicCalendar: '/economic-calendar',
  faqs: '/faqs-trading-platform',
  marketsCryptocurrencies: '/cryptocurrencies',
  marketsCurrencies: '/currencies',
  marketsStocks: '/stocks',
  marketsCommodities: '/commodities',
  marketsIndices: '/indices',
  learningCfds: '/cfds',
  learningMarketMovers: '/market-movers',
  learningTradingPitfalls: '/trading-pitfalls',
  learningSmartTrading: '/smart-trading',
  learningTechnicalFundamental: '/technical-fundamental',
  learningGlossary: '/glossary',
  learningNfp: '/nfp'
} as const;

export const landingLanguages = [
  { code: 'en', label: 'English', flag: 'gb' },
  { code: 'ar', label: 'العربية', flag: 'sa' }
] as const;

export const landingDefaultLanguage = landingLanguages[0];

export type LandingHeaderMenuItem = {
  label: string;
  href: string;
};

export type LandingHeaderMenu = {
  label: string;
  items: LandingHeaderMenuItem[];
};

export const landingHeaderMenus: LandingHeaderMenu[] = [
  {
    label: 'Markets',
    items: [
      { label: 'Cryptocurrencies', href: landingPlaceholderLink },
      { label: 'Currencies', href: landingPlaceholderLink },
      { label: 'Stocks', href: landingPlaceholderLink },
      { label: 'Commodities', href: landingPlaceholderLink },
      { label: 'Indices', href: landingPlaceholderLink }
    ]
  },
  {
    label: 'Learning',
    items: [
      { label: 'Education', href: landingPlaceholderLink },
      { label: 'Economic Calendar', href: landingSiteLinks.economicCalendar },
      { label: 'CFDs', href: landingSiteLinks.learningCfds },
      { label: 'Market Movers', href: landingSiteLinks.learningMarketMovers },
      { label: 'Trading Pitfalls', href: landingSiteLinks.learningTradingPitfalls },
      { label: 'Smart Trading', href: landingSiteLinks.learningSmartTrading },
      {
        label: 'Technical and Fundamental',
        href: landingSiteLinks.learningTechnicalFundamental
      },
      { label: 'Glossary', href: landingSiteLinks.learningGlossary },
      { label: 'NFP', href: landingSiteLinks.learningNfp }
    ]
  },
  {
    label: 'Account',
    items: [
      { label: 'About Us', href: landingSiteLinks.aboutUs },
      { label: 'FAQs – Trading Platform', href: landingSiteLinks.faqs }
    ]
  }
];

/** Manual USDT deposit networks — wallet addresses are shown on the client only. */
export const MANUAL_USDT_DEPOSIT_NETWORKS = [
  {
    id: 'trc20',
    label: 'USDT TRC20',
    hint: 'Tron network',
    address: 'TPUVPMAkhyeFpPVbJkX4nmyYbDZzWcVMDP'
  },
  {
    id: 'erc20',
    label: 'USDT ERC20',
    hint: 'Ethereum network',
    address: '0x11740455c9aFD3C2a637d702931b3900be8B85F8'
  },
  {
    id: 'bnb',
    label: 'USDT BNB',
    hint: 'BNB Smart Chain',
    address: '0x11740455c9aFD3C2a637d702931b3900be8B85F8'
  }
] as const;

export type ManualUsdtDepositNetworkId =
  (typeof MANUAL_USDT_DEPOSIT_NETWORKS)[number]['id'];

/** Symbols shown on the public landing page market ticker (Twelve Data). */
export const landingMarketTapeSymbols = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'NVDA',
  'TSLA',
  'JPM',
  'V',
  'WMT',
  'AMD',
  'NFLX',
  'DIS',
  'BA'
] as const;

/** Fallback values for landing tape when market data provider is unavailable. */
export const landingMarketTapeDefaultQuotes = {
  AAPL: { price: 190.5, percentChange: 0.42 },
  MSFT: { price: 420.25, percentChange: 0.31 },
  GOOGL: { price: 172.1, percentChange: -0.18 },
  AMZN: { price: 186.4, percentChange: 0.27 },
  META: { price: 492.3, percentChange: 0.54 },
  NVDA: { price: 905.75, percentChange: 0.89 },
  TSLA: { price: 177.8, percentChange: -0.63 },
  JPM: { price: 198.6, percentChange: 0.15 },
  V: { price: 274.15, percentChange: 0.22 },
  WMT: { price: 63.9, percentChange: -0.11 },
  AMD: { price: 166.2, percentChange: 0.76 },
  NFLX: { price: 621.45, percentChange: 0.48 },
  DIS: { price: 110.35, percentChange: -0.24 },
  BA: { price: 181.7, percentChange: 0.09 }
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
