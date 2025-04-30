import { MarketingConfig } from "types";

import { siteConfig } from "./site";

export const marketingConfig: MarketingConfig = {
  mainNav: [
    // {
    //   title: "OiChat",
    //   href: siteConfig.links.oichat,
    // },
    {
      title: "文档",
      href: "/docs",
    },
    {
      title: "反馈",
      href: siteConfig.links.feedback,
    },
    {
      title: "Telegram",
      href: siteConfig.links.Telegram,
    },
    {
      title: "价格",
      href: "/#pricing",
    },
  ],
};
