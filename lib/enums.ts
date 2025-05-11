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
  "www.qali.cn",
  "api.qali.cn",
  "dev.qali.cn",
  "admin.qali.cn",
  "mail.qali.cn",
  "smtp.qali.cn",
  "pop.qali.cn",
  "imap.qali.cn",
  "ftp.qali.cn",
  "sftp.qali.cn",
  "ns1.qali.cn",
  "ns2.qali.cn",
  "dns.qali.cn",
  "vpn.qali.cn",
  "cdn.qali.cn",
  "proxy.qali.cn",
  "gateway.qali.cn",
  "server.qali.cn",
  "host.qali.cn",
  "staging.qali.cn",
  "test.qali.cn",
  "demo.qali.cn",

  "github.qali.cn",
  "gitlab.qali.cn",
  "bitbucket.qali.cn",
  "heroku.qali.cn",
  "vercel.qali.cn",
  "netlify.qali.cn",
  "cloudflare.qali.cn",
  "azure.qali.cn",
  "aws.qali.cn",
  "gcp.qali.cn",

  "facebook.qali.cn",
  "twitter.qali.cn",
  "instagram.qali.cn",
  "linkedin.qali.cn",
  "youtube.qali.cn",
  "tiktok.qali.cn",
  "whatsapp.qali.cn",
  "telegram.qali.cn",
  "Telegram.qali.cn",
  "slack.qali.cn",

  "blog.qali.cn",
  "shop.qali.cn",
  "store.qali.cn",
  "app.qali.cn",
  "web.qali.cn",
  "portal.qali.cn",
  "auth.qali.cn",
  "login.qali.cn",
  "account.qali.cn",
  "help.qali.cn",
  "support.qali.cn",
  "status.qali.cn",
  "docs.qali.cn",
  "wiki.qali.cn",

  "security.qali.cn",
  "secure.qali.cn",
  "ssl.qali.cn",
  "cert.qali.cn",
  "phishing.qali.cn",
  "spam.qali.cn",
  "abuse.qali.cn",

  "dashboard.qali.cn",
  "analytics.qali.cn",
  "monitor.qali.cn",
  "stats.qali.cn",
  "metrics.qali.cn",
  "logs.qali.cn",
  "backup.qali.cn",
  "git.qali.cn",
  "svn.qali.cn",

  "zhihu.qali.cn",
  "weibo.qali.cn",
  "taobao.qali.cn",
  "qq.qali.cn",
  "wechat.qali.cn",
  "weixin.qali.cn",
  "alipay.qali.cn",
  "baidu.qali.cn",

  "root.qali.cn",
  "administrator.qali.cn",
  "admin1.qali.cn",
  "test1.qali.cn",
  "demo1.qali.cn",
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
