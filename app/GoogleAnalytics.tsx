"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import * as gtag from "../gtag.js";

// 定义性能指标类型
interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * Google Analytics 组件，支持页面跟踪和性能指标
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

  // 监听性能指标
  useEffect(() => {
    if (!gtag.GA_TRACKING_ID) return;

    // 捕获web-vitals指标
    if (typeof window !== 'undefined' && 'performance' in window) {
      // 当LCP性能指标可用时发送到GA
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcpMetric = {
              name: 'LCP',
              value: entry.startTime,
              id: entry.id
            };
            // 发送性能指标到GA
            gtag.event({
              action: 'web_vitals',
              category: 'Web Vitals',
              label: lcpMetric.name,
              value: Math.round(lcpMetric.value)
            });
          }
        });
      });

      // 开始观察LCP指标
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.error('性能指标监控失败:', e);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // 如果没有配置GA ID，不渲染组件
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
            
            // 添加全局异常跟踪
            window.addEventListener('error', function(event) {
              gtag('event', 'exception', {
                'description': event.message,
                'fatal': true
              });
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
