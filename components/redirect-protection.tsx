"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RedirectProtection() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 检测是否存在重定向循环
    const redirectCount = sessionStorage.getItem('redirectCount');
    
    // 如果检测到文档路径访问超过一定次数，重置导航状态
    if ((pathname.includes('/docs/') || pathname.includes('/_next/static/')) && 
        redirectCount && parseInt(redirectCount) > 3) {
      // 重定向到重置页面
      window.location.href = `/force-reload?path=${encodeURIComponent(pathname)}`;
      return;
    } else if (pathname.includes('/docs/') || pathname.includes('/_next/static/')) {
      sessionStorage.setItem('redirectCount', redirectCount ? (parseInt(redirectCount) + 1).toString() : '1');
    } else {
      sessionStorage.removeItem('redirectCount');
    }

    // 监测静态资源加载的循环
    if (pathname.includes('/_next/static/')) {
      // 记录路径访问频率
      const visitedPaths = JSON.parse(localStorage.getItem('visitedStaticPaths') || '{}');
      const count = (visitedPaths[pathname] || 0) + 1;
      visitedPaths[pathname] = count;
      
      // 如果同一资源短时间内加载超过3次，可能存在循环
      if (count > 3) {
        window.location.href = `/force-reload?path=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      
      localStorage.setItem('visitedStaticPaths', JSON.stringify(visitedPaths));
      
      // 定时清理记录
      setTimeout(() => {
        const oldPaths = JSON.parse(localStorage.getItem('visitedStaticPaths') || '{}');
        delete oldPaths[pathname];
        localStorage.setItem('visitedStaticPaths', JSON.stringify(oldPaths));
      }, 10000); // 10秒后清理
    }
  }, [pathname]);

  return null;
} 