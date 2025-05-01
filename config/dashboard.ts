import { UserRole } from "@prisma/client";

import { SidebarNavItem } from "types";

import { siteConfig } from "./site";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "菜单",
    items: [
      { href: "/dashboard", icon: "dashboard", title: "控制台" },
      { href: "/dashboard/urls", icon: "link", title: "短链接" },
      { href: "/emails", icon: "mail", title: "邮箱" },
      { href: "/dashboard/records", icon: "globeLock", title: "DNS记录" },
      { href: "/dashboard/custom-domains", icon: "globe", title: "自定义域名" },
      { href: "/chat", icon: "messages", title: "WRoom" },
    ],
  },
  {
    title: "数据抓取",
    items: [
      {
        href: "/dashboard/scrape",
        icon: "bug",
        title: "概览",
      },
      {
        href: "/dashboard/scrape/screenshot",
        icon: "camera",
        title: "截图",
      },
      {
        href: "/dashboard/scrape/meta-info",
        icon: "globe",
        title: "元信息",
      },
      {
        href: "/dashboard/scrape/markdown",
        icon: "fileText",
        title: "Markdown",
      },
      {
        href: "/dashboard/scrape/qrcode",
        icon: "qrcode",
        title: "二维码",
      },
    ],
  },
  {
    title: "管理员",
    items: [
      {
        href: "/admin",
        icon: "laptop",
        title: "管理面板",
      },
      {
        href: "/admin/users",
        icon: "users",
        title: "用户",
      },
      {
        href: "/admin/urls",
        icon: "link",
        title: "链接",
      },
      {
        href: "/admin/records",
        icon: "globe",
        title: "记录",
      },
    ],
  },
  {
    title: "选项",
    items: [
      { href: "/dashboard/settings", icon: "settings", title: "设置" },
      { href: "/docs", icon: "bookOpen", title: "文档" },
      {
        href: siteConfig.links.feedback,
        icon: "messageQuoted",
        title: "反馈",
      },
      {
        href: "mailto:" + siteConfig.mailSupport,
        icon: "mail",
        title: "支持",
      },
    ],
  },
];
