"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RedirectProtection() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 仅检测文档路径
    if (pathname.includes('/docs/')) {
      // 检测到文档路径，简单地添加特定查询参数
      if (!window.location.search.includes('no_redirect=true') && 
          pathname.includes('/docs/')) {
        // 添加参数避免循环
        router.push(`${pathname}?no_redirect=true`);
      }
    }
  }, [pathname, router]);

  return null;
} 