"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import * as gtag from "../gtag.js";

/**
 * Google Analytics 组件，支持页面跟踪和基础性能监控
 */
const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 监听路由变化，发送页面浏览事件
  useEffect(() => {
    if (!gtag.GA_TRACKING_ID) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    gtag.pageview(url);
  }, [pathname, searchParams]);

  // 监控基础性能指标
  useEffect(() => {
    if (!gtag.GA_TRACKING_ID || typeof window === 'undefined') return;

    // 页面加载完成后发送性能数据
    const handleLoad = () => {
      // 等待所有资源加载完成再收集性能数据
      setTimeout(() => {
        if (window.performance) {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          
          if (pageLoadTime > 0) {
            gtag.event({
              action: 'timing_complete',
              category: '页面加载',
              label: '总加载时间',
              value: pageLoadTime
            });
          }
        }
      }, 0);
    };

    window.addEventListener('load', handleLoad);

    // 添加全局错误跟踪
    const handleError = (event) => {
      gtag.event({
        action: 'exception',
        category: '错误',
        label: event.message || '未知错误',
        value: 0
      });
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (!gtag.GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
        defer
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        defer
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              transport_type: 'beacon',
              anonymize_ip: true,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
