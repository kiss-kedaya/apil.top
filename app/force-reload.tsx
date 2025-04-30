"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 这个组件用于强制重置可能导致的重定向循环
export default function ForceReload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPath = searchParams.get("path") || "/";
  
  useEffect(() => {
    // 清除本地存储的相关数据
    if (typeof window !== "undefined") {
      // 清除与重定向相关的数据
      sessionStorage.removeItem("redirectCount");
      
      // 清除相关缓存
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes("next-") || key.includes("visitedStaticPaths"));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      // 如果有targetPath，则导航到该路径
      setTimeout(() => {
        window.location.href = targetPath;
      }, 100);
    }
  }, [targetPath]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">页面正在重置...</h1>
      <p className="mt-2 text-gray-600">正在解决重定向问题并加载页面...</p>
    </div>
  );
} 