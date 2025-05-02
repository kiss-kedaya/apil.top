import { SidebarNavItem } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;
const open_signup = env.NEXT_PUBLIC_OPEN_SIGNUP;
const short_domains = env.NEXT_PUBLIC_SHORT_DOMAINS || "";
const email_domains = env.NEXT_PUBLIC_EMAIL_DOMAINS || "";
const email_r2_domain = env.NEXT_PUBLIC_EMAIL_R2_DOMAIN || "";
const user_custom_domains = env.NEXT_PUBLIC_USER_CUSTOM_DOMAINS || "";

// 定义站点配置类型
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
    feedback: string;
    Telegram: string;
    oichat: string;
  };
  mailSupport: string;
  openSignup: boolean;
  shortDomains: string[];
  emailDomains: string[];
  emailR2Domain: string;
  userCustomDomains: string[];
  mainDomains: string[]; // 添加主域名配置
}

export const siteConfig: SiteConfig = {
  name: "apilTop",
  description:
    "全能助手，链接、图床、邮箱、API，全部功能只需一个域名",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://apil.top",
  ogImage: "https://apil.top/opengraph-image.jpg",
  links: {
    twitter: "https://twitter.com/kedayacom",
    github: "https://github.com/KedayaLive",
    feedback: "https://github.com/kiss-kedaya/apil.top/issues",
    Telegram: "https://t.me/TGG798",
    oichat: "https://oi.apil.top",
  },
  mailSupport: "kedaya0226@qq.com",
  openSignup: open_signup === "1" ? true : false,
  shortDomains: short_domains.split(","),
  emailDomains: email_domains.split(",").filter(domain => domain.trim() !== ""),
  emailR2Domain: email_r2_domain,
  userCustomDomains: user_custom_domains.split(",").filter(domain => domain.trim() !== ""),
  mainDomains: ["apil.top", "localhost"], // 主域名列表，用于识别自定义域名
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "公司",
    items: [
      { title: "关于", href: "/docs" },
      { title: "条款", href: "/terms" },
      { title: "隐私", href: "/privacy" },
      { title: "博客", href: "https://www.kiss-kedaya.dev" },
      { title: "反馈", href: siteConfig.links.feedback },
    ],
  },
  {
    title: "文档",
    items: [
      { title: "介绍", href: "/docs" },
      { title: "指南", href: "/docs/quick-start" },
      { title: "开发者", href: "/docs/developer" },
      { title: "联系我们", href: "mailto:kedaya0226@qq.com" },
    ],
  },
];
