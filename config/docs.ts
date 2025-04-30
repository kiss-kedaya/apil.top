import { DocsConfig } from "types";

export const docsConfig: DocsConfig = {
  mainNav: [],
  sidebarNav: [
    {
      title: "入门指南",
      items: [
        {
          title: "介绍",
          href: "/docs",
          icon: "page",
        },
        {
          title: "快速开始",
          href: "/docs/quick-start",
          icon: "page",
        },
        {
          title: "短链接",
          href: "/docs/short-urls",
          icon: "page",
        },
        {
          title: "邮箱",
          href: "/docs/emails",
          icon: "page",
        },
        {
          title: "DNS记录",
          href: "/docs/dns-records",
          icon: "page",
        },
        {
          title: "自定义域名",
          href: "/docs/custom-domains",
          icon: "page",
        },
        {
          title: "WRoom",
          href: "/docs/wroom",
          icon: "page",
        },
      ],
    },
    {
      title: "开放API",
      items: [
        {
          title: "概览",
          href: "/docs/open-api",
          icon: "page",
        },
        {
          title: "截图API",
          href: "/docs/open-api/screenshot",
          icon: "page",
        },
        {
          title: "元数据抓取API",
          href: "/docs/open-api/meta-info",
          icon: "page",
        },
        {
          title: "链接转Markdown API",
          href: "/docs/open-api/markdown",
          icon: "page",
        },
        {
          title: "链接转文本API",
          href: "/docs/open-api/text",
          icon: "page",
        },
        {
          title: "链接转二维码API",
          href: "/docs/open-api/qrcode",
          icon: "page",
        },
        {
          title: "SVG图标API",
          href: "/docs/open-api/icon",
          icon: "page",
        },
      ],
    },
    {
      title: "示例",
      items: [
        {
          title: "Cloudflare自定义域名",
          href: "/docs/examples/cloudflare",
          icon: "page",
        },
        {
          title: "Vercel自定义域名",
          href: "/docs/examples/vercel",
          icon: "page",
        },
        {
          title: "Zeabur自定义域名",
          href: "/docs/examples/zeabur",
          icon: "page",
        },
        {
          title: "其他平台",
          href: "/docs/examples/other",
          icon: "page",
        },
      ],
    },
    {
      title: "开发者",
      items: [
        {
          title: "安装",
          href: "/docs/developer/installation",
          icon: "page",
        },
        {
          title: "快速开始",
          href: "/docs/developer/quick-start",
          icon: "page",
        },
        {
          title: "Cloudflare",
          href: "/docs/developer/cloudflare",
          icon: "page",
        },
        {
          title: "认证",
          href: "/docs/developer/authentification",
          icon: "page",
        },
        {
          title: "邮件",
          href: "/docs/developer/email",
          icon: "page",
        },
        {
          title: "邮件Worker",
          href: "/docs/developer/cloudflare-email-worker",
          icon: "page",
        },
        {
          title: "数据库",
          href: "/docs/developer/database",
          icon: "page",
        },
        {
          title: "组件",
          href: "/docs/developer/components",
          icon: "page",
        },
        {
          title: "配置文件",
          href: "/docs/developer/config-files",
          icon: "page",
        },
        {
          title: "Markdown文件",
          href: "/docs/developer/markdown-files",
          icon: "page",
        },
      ],
    },
  ],
};
