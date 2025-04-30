export const EXPIRATION_ENUMS = [
  {
    value: "-1",
    label: "Never",
  },
  {
    value: "10", // 10s
    label: "10s",
  },
  {
    value: "60", // 1 min
    label: "60s",
  },
  {
    value: "600", // 10 min
    label: "10min",
  },
  {
    value: "3600", // 1h
    label: "1h",
  },
  {
    value: "43200", // 12h
    label: "12h",
  },
  {
    value: "86400", // 1d
    label: "1d",
  },
  {
    value: "604800", // 7d
    label: "7d",
  },
  {
    value: "2592000", // 30d
    label: "30d",
  },
  {
    value: "7776000", // 90d
    label: "90d",
  },
  {
    value: "31536000", // 365d
    label: "365d",
  },
];

export const ROLE_ENUM = [
  {
    label: "User",
    value: "USER",
  },
  {
    label: "Admin",
    value: "ADMIN",
  },
];

export const RECORD_TYPE_ENUMS = [
  {
    value: "CNAME",
    label: "CNAME",
  },
  {
    value: "A",
    label: "A",
  },
  {
    value: "TXT",
    label: "TXT",
  },
];
export const TTL_ENUMS = [
  {
    value: "1",
    label: "Auto",
  },
  {
    value: "300",
    label: "5min",
  },
  {
    value: "3600",
    label: "1h",
  },
  {
    value: "18000",
    label: "5h",
  },
  {
    value: "86400",
    label: "1d",
  },
];
export const STATUS_ENUMS = [
  {
    value: 1,
    label: "Active",
  },
  {
    value: 0,
    label: "Inactive",
  },
];

export const reservedDomains = [
  "www.apil.top",
  "api.apil.top",
  "dev.apil.top",
  "admin.apil.top",
  "mail.apil.top",
  "smtp.apil.top",
  "pop.apil.top",
  "imap.apil.top",
  "ftp.apil.top",
  "sftp.apil.top",
  "ns1.apil.top",
  "ns2.apil.top",
  "dns.apil.top",
  "vpn.apil.top",
  "cdn.apil.top",
  "proxy.apil.top",
  "gateway.apil.top",
  "server.apil.top",
  "host.apil.top",
  "staging.apil.top",
  "test.apil.top",
  "demo.apil.top",

  "github.apil.top",
  "gitlab.apil.top",
  "bitbucket.apil.top",
  "heroku.apil.top",
  "vercel.apil.top",
  "netlify.apil.top",
  "cloudflare.apil.top",
  "azure.apil.top",
  "aws.apil.top",
  "gcp.apil.top",

  "facebook.apil.top",
  "twitter.apil.top",
  "instagram.apil.top",
  "linkedin.apil.top",
  "youtube.apil.top",
  "tiktok.apil.top",
  "whatsapp.apil.top",
  "telegram.apil.top",
  "discord.apil.top",
  "slack.apil.top",

  "blog.apil.top",
  "shop.apil.top",
  "store.apil.top",
  "app.apil.top",
  "web.apil.top",
  "portal.apil.top",
  "auth.apil.top",
  "login.apil.top",
  "account.apil.top",
  "help.apil.top",
  "support.apil.top",
  "status.apil.top",
  "docs.apil.top",
  "wiki.apil.top",

  "security.apil.top",
  "secure.apil.top",
  "ssl.apil.top",
  "cert.apil.top",
  "phishing.apil.top",
  "spam.apil.top",
  "abuse.apil.top",

  "dashboard.apil.top",
  "analytics.apil.top",
  "monitor.apil.top",
  "stats.apil.top",
  "metrics.apil.top",
  "logs.apil.top",
  "backup.apil.top",
  "git.apil.top",
  "svn.apil.top",

  "zhihu.apil.top",
  "weibo.apil.top",
  "taobao.apil.top",
  "qq.apil.top",
  "wechat.apil.top",
  "weixin.apil.top",
  "alipay.apil.top",
  "baidu.apil.top",

  "root.apil.top",
  "administrator.apil.top",
  "admin1.apil.top",
  "test1.apil.top",
  "demo1.apil.top",
];

export const reservedAddressSuffix = [
  "admin",
  "support",
  "billing",
  "security",
  "root",
  "administrator",
  "system",
  "noreply",
  "no-reply",
  "info",
  "contact",
  "help",
  "hello",
  "hi",
  "inquiries",
  "feedback",
  "suggestions",
  "service",
  "customerservice",
  "supportteam",
  "care",
  "assistance",
  "complaints",
  "sales",
  "marketing",
  "business",
  "partnerships",
  "advertising",
  "promo",
  "deals",
  "accounts",
  "payment",
  "finance",
  "invoicing",
  "refunds",
  "subscriptions",
  "webmaster",
  "postmaster",
  "hostmaster",
  "tech",
  "it",
  "ops",
  "dev",
  "developer",
  "engineering",
  "privacy",
  "abuse",
  "legal",
  "compliance",
  "trust",
  "fraud",
  "report",
  "news",
  "updates",
  "alerts",
  "notifications",
  "welcome",
  "verify",
  "confirmation",
  "team",
  "staff",
  "hr",
  "jobs",
  "careers",
  "press",
  "media",
  "events",
];

export const LOGS_LIMITEs_ENUMS = [
  {
    value: "50",
    label: "50",
  },
  {
    value: "100",
    label: "100",
  },
  {
    value: "200",
    label: "200",
  },
  {
    value: "500",
    label: "500",
  },
  {
    value: "1000",
    label: "1000",
  },
];

export const TIME_RANGES: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "60d": 60 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "180d": 180 * 24 * 60 * 60 * 1000,
  "365d": 365 * 24 * 60 * 60 * 1000,
};

export const DATE_DIMENSION_ENUMS = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "60d", label: "Last 2 Months" },
  { value: "90d", label: "Last 3 Months" },
  { value: "180d", label: "Last 6 Months" },
  { value: "365d", label: "Last 1 Year" },
  { value: "All", label: "All the time" },
] as const;
