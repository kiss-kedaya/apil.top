import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;
const open_signup = env.NEXT_PUBLIC_OPEN_SIGNUP;
const short_domains = env.NEXT_PUBLIC_SHORT_DOMAINS || "";
const email_domains = env.NEXT_PUBLIC_EMAIL_DOMAINS || "";
const email_r2_domain = env.NEXT_PUBLIC_EMAIL_R2_DOMAIN || "";

export const siteConfig: SiteConfig = {
  name: "kedaya.xyz",
  description: "DNS记录分发系统",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/yesmoree",
    github: "https://github.com/oiov/kedaya.xyz",
    feedback: "https://github.com/oiov/kedaya.xyz/issues",
    discord: "https://discord.gg/AHPQYuZu3m",
    oichat: "https://oi.kedaya.xyz",
  },
  mailSupport: "kedaya0226@qq.com",
  openSignup: open_signup === "1" ? true : false,
  shortDomains: short_domains.split(","),
  emailDomains: email_domains.split(","),
  emailR2Domain: email_r2_domain,
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "公司",
    items: [
      { title: "关于", href: "/docs" },
      { title: "条款", href: "/terms" },
      { title: "隐私", href: "/privacy" },
      { title: "博客", href: "https://www.oiov.dev" },
      { title: "反馈", href: siteConfig.links.feedback },
    ],
  },
  {
    title: "产品",
    items: [
      { title: "Vmail", href: "https://vmail.dev" },
      { title: "Moise", href: "https://moise.oiov.dev" },
      // { title: "Inke", href: "https://inke.kedaya.xyz" },
      { title: "Iconce", href: "https://iconce.com" },
      { title: "OiChat", href: siteConfig.links.oichat },
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
