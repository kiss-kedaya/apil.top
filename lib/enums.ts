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
  "www.wr.do",
  "api.wr.do",
  "dev.wr.do",
  "admin.wr.do",
  "mail.wr.do",
  "smtp.wr.do",
  "pop.wr.do",
  "imap.wr.do",
  "ftp.wr.do",
  "sftp.wr.do",
  "ns1.wr.do",
  "ns2.wr.do",
  "dns.wr.do",
  "vpn.wr.do",
  "cdn.wr.do",
  "proxy.wr.do",
  "gateway.wr.do",
  "server.wr.do",
  "host.wr.do",
  "staging.wr.do",
  "test.wr.do",
  "demo.wr.do",

  "github.wr.do",
  "gitlab.wr.do",
  "bitbucket.wr.do",
  "heroku.wr.do",
  "vercel.wr.do",
  "netlify.wr.do",
  "cloudflare.wr.do",
  "azure.wr.do",
  "aws.wr.do",
  "gcp.wr.do",

  "facebook.wr.do",
  "twitter.wr.do",
  "instagram.wr.do",
  "linkedin.wr.do",
  "youtube.wr.do",
  "tiktok.wr.do",
  "whatsapp.wr.do",
  "telegram.wr.do",
  "discord.wr.do",
  "slack.wr.do",

  "blog.wr.do",
  "shop.wr.do",
  "store.wr.do",
  "app.wr.do",
  "web.wr.do",
  "portal.wr.do",
  "auth.wr.do",
  "login.wr.do",
  "account.wr.do",
  "help.wr.do",
  "support.wr.do",
  "status.wr.do",
  "docs.wr.do",
  "wiki.wr.do",

  "security.wr.do",
  "secure.wr.do",
  "ssl.wr.do",
  "cert.wr.do",
  "phishing.wr.do",
  "spam.wr.do",
  "abuse.wr.do",

  "dashboard.wr.do",
  "analytics.wr.do",
  "monitor.wr.do",
  "stats.wr.do",
  "metrics.wr.do",
  "logs.wr.do",
  "backup.wr.do",
  "git.wr.do",
  "svn.wr.do",

  "zhihu.wr.do",
  "weibo.wr.do",
  "taobao.wr.do",
  "qq.wr.do",
  "wechat.wr.do",
  "weixin.wr.do",
  "alipay.wr.do",
  "baidu.wr.do",

  "root.wr.do",
  "administrator.wr.do",
  "admin1.wr.do",
  "test1.wr.do",
  "demo1.wr.do",
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
