export const PRIMARY_NAV = ["Home", "About", "Markets"] as const

export const SUB_NAV_FILTERS = [
  { label: "All", active: true },
  { label: "Trending", icon: "local_fire_department" },
  { label: "New", icon: "new_releases" },
  { label: "Ending soon", icon: "timer" },
  { label: "Top volume", icon: "bar_chart" },
] as const

export const SUB_NAV_CATEGORIES = [
  "Politics",
  "Crypto",
  "Sports",
  "Finance",
  "Tech",
  "Enterta",
] as const

export const HERO_STATS = [
  { label: "24H VOLUME", value: "R 971.54M", accent: "primary-container" },
  { label: "OPEN MARKETS", value: "32", accent: "slate-text" },
  { label: "ACTIVE TRADERS", value: "48,210", accent: "danger-red" },
  { label: "AVG. SPREAD", value: "0.4%", accent: "primary-container" },
] as const

export const TICKER_ITEMS = [
  {
    question: "Will Bitcoin reach $200,000 by end of 2...",
    chance: "42%",
    change: "↗8.0%",
    positive: true,
  },
  {
    question: "Will the ANC win an outright majority in ...",
    chance: "31%",
    change: "↘-5.0%",
    positive: false,
  },
  {
    question: "Will the SEC approve ETH ETF staking b...",
    chance: "67%",
    change: "↗12.0%",
    positive: true,
  },
] as const

export const FEATURED_MARKETS = [
  {
    initials: "CR",
    question: "Will Bitcoin reach $200,000 by end of 2026?",
    chance: 42,
    yesPrice: "42%",
    noPrice: "58%",
    tag: "CRYPTO",
    volume: "R 151.58M",
    timeLeft: "175d left",
    trend: "+8.0%",
    positive: true,
  },
  {
    initials: "FI",
    question: "Will the Fed cut rates at the July 2026 meeting?",
    chance: 58,
    yesPrice: "58%",
    noPrice: "42%",
    tag: "FINANCE",
    volume: "R 92.19M",
    timeLeft: "13d left",
    trend: "-4.0%",
    positive: false,
  },
  {
    initials: "PO",
    question: "Will the ANC win an outright majority in 2026?",
    chance: 31,
    yesPrice: "31%",
    noPrice: "69%",
    tag: "POLITICS",
    volume: "R 78.42M",
    timeLeft: "210d left",
    trend: "-5.0%",
    positive: false,
  },
  {
    initials: "SP",
    question: "Will Springboks win the Rugby Championship 2026?",
    chance: 71,
    yesPrice: "71%",
    noPrice: "29%",
    tag: "SPORTS",
    volume: "R 34.10M",
    timeLeft: "89d left",
    trend: "+3.2%",
    positive: true,
  },
] as const

export const CATEGORIES = [
  { label: "Politics", count: 4 },
  { label: "Crypto", count: 4 },
  { label: "Sports", count: 3 },
  { label: "Finance", count: 2 },
  { label: "Tech", count: 2 },
  { label: "Entertainment", count: 1 },
  { label: "World", count: 1 },
] as const

export const PROMO_STATS = [
  { value: "$1.00", label: "MAX PAYOUT" },
  { value: "<60s", label: "SETTLEMENT" },
  { value: "0%", label: "DEPOSIT FEE" },
] as const

export const FOOTER_MARKETS = [
  "Politics",
  "Crypto",
  "Sports",
  "Finance",
  "Tech",
] as const

export const FOOTER_PLATFORM = [
  "How it works",
  "Fees",
  "Liquidity",
  "API",
] as const

export const FOOTER_COMPANY = [
  "About",
  "Careers",
  "Press",
  "Contact",
  "Disclaimer",
  "Terms",
] as const
