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
  "www.kedaya.xyz",
  "api.kedaya.xyz",
  "dev.kedaya.xyz",
  "admin.kedaya.xyz",
  "mail.kedaya.xyz",
  "smtp.kedaya.xyz",
  "pop.kedaya.xyz",
  "imap.kedaya.xyz",
  "ftp.kedaya.xyz",
  "sftp.kedaya.xyz",
  "ns1.kedaya.xyz",
  "ns2.kedaya.xyz",
  "dns.kedaya.xyz",
  "vpn.kedaya.xyz",
  "cdn.kedaya.xyz",
  "proxy.kedaya.xyz",
  "gateway.kedaya.xyz",
  "server.kedaya.xyz",
  "host.kedaya.xyz",
  "staging.kedaya.xyz",
  "test.kedaya.xyz",
  "demo.kedaya.xyz",

  "github.kedaya.xyz",
  "gitlab.kedaya.xyz",
  "bitbucket.kedaya.xyz",
  "heroku.kedaya.xyz",
  "vercel.kedaya.xyz",
  "netlify.kedaya.xyz",
  "cloudflare.kedaya.xyz",
  "azure.kedaya.xyz",
  "aws.kedaya.xyz",
  "gcp.kedaya.xyz",

  "facebook.kedaya.xyz",
  "twitter.kedaya.xyz",
  "instagram.kedaya.xyz",
  "linkedin.kedaya.xyz",
  "youtube.kedaya.xyz",
  "tiktok.kedaya.xyz",
  "whatsapp.kedaya.xyz",
  "telegram.kedaya.xyz",
  "discord.kedaya.xyz",
  "slack.kedaya.xyz",

  "blog.kedaya.xyz",
  "shop.kedaya.xyz",
  "store.kedaya.xyz",
  "app.kedaya.xyz",
  "web.kedaya.xyz",
  "portal.kedaya.xyz",
  "auth.kedaya.xyz",
  "login.kedaya.xyz",
  "account.kedaya.xyz",
  "help.kedaya.xyz",
  "support.kedaya.xyz",
  "status.kedaya.xyz",
  "docs.kedaya.xyz",
  "wiki.kedaya.xyz",

  "security.kedaya.xyz",
  "secure.kedaya.xyz",
  "ssl.kedaya.xyz",
  "cert.kedaya.xyz",
  "phishing.kedaya.xyz",
  "spam.kedaya.xyz",
  "abuse.kedaya.xyz",

  "dashboard.kedaya.xyz",
  "analytics.kedaya.xyz",
  "monitor.kedaya.xyz",
  "stats.kedaya.xyz",
  "metrics.kedaya.xyz",
  "logs.kedaya.xyz",
  "backup.kedaya.xyz",
  "git.kedaya.xyz",
  "svn.kedaya.xyz",

  "zhihu.kedaya.xyz",
  "weibo.kedaya.xyz",
  "taobao.kedaya.xyz",
  "qq.kedaya.xyz",
  "wechat.kedaya.xyz",
  "weixin.kedaya.xyz",
  "alipay.kedaya.xyz",
  "baidu.kedaya.xyz",

  "root.kedaya.xyz",
  "administrator.kedaya.xyz",
  "admin1.kedaya.xyz",
  "test1.kedaya.xyz",
  "demo1.kedaya.xyz",
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
