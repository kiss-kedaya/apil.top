"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 这个组件用于强制重置可能导致的重定向循环
export default function ForceReload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPath = searchParams.get("path") || "/";
  
  useEffect(() => {
    // 简化重定向逻辑，仅执行基本重定向
    setTimeout(() => {
      router.push(targetPath);
    }, 300);
  }, [targetPath, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">页面正在重置...</h1>
      <p className="mt-2 text-gray-600">正在解决重定向问题并加载页面...</p>
    </div>
  );
} 