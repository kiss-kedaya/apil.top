"use client";

import { useState, useEffect } from 'react';
import { siteConfig } from '@/config/site';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DomainSelectorProps {
  type?: "email" | "shortlink";
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

// 缓存不同类型的域名数据，避免重复请求
const domainsCache: Record<string, {
  timestamp: number;
  domains: string[];
}> = {};

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000;

export default function DomainSelector({
  type = "shortlink",
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = "选择域名",
  className = "",
  triggerClassName = ""
}: DomainSelectorProps) {
  const [domains, setDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取默认域名列表
  const defaultDomains = type === "email" 
    ? siteConfig.emailDomains 
    : siteConfig.shortDomains;
  
  useEffect(() => {
    async function loadVerifiedDomains() {
      try {
        // 检查缓存是否有效
        const cacheKey = `domains-${type}`;
        const cachedData = domainsCache[cacheKey];
        const now = Date.now();
        
        if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY) {
          console.log(`使用缓存的域名数据 (${type})`);
          setDomains(cachedData.domains);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        // 构建请求参数，添加类型过滤
        const url = new URL('/api/custom-domain', window.location.origin);
        url.searchParams.append('verified', 'true');
        if (type) {
          url.searchParams.append('type', type);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`获取域名失败: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'success' && result.data && Array.isArray(result.data)) {
          // 提取域名列表
          const customDomains = result.data
            .filter((domain: any) => domain.isVerified)
            .map((domain: any) => domain.domainName);
          
          const allDomains = [...defaultDomains, ...customDomains];
          setDomains(allDomains);
          
          // 更新缓存
          domainsCache[cacheKey] = {
            timestamp: now,
            domains: allDomains
          };
          
          console.log(`已加载已验证域名 (${type}):`, customDomains);
        } else {
          console.log('域名数据格式不正确:', result);
          setDomains(defaultDomains);
        }
      } catch (error) {
        console.error('获取已验证域名出错:', error);
        setError(error instanceof Error ? error.message : '未知错误');
        setDomains(defaultDomains);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVerifiedDomains();
  }, [type, defaultDomains]);
  
  return (
    <div className={className}>
      <Select 
        value={value}
        defaultValue={defaultValue || (domains.length > 0 ? domains[0] : undefined)}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={cn("bg-transparent border-0 shadow-none hover:bg-background/5 transition-colors focus:ring-0", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border rounded-md">
          {isLoading ? (
            <div className="flex items-center space-x-2 p-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <div className="text-sm">加载中...</div>
            </div>
          ) : error ? (
            <div className="px-2 py-1 text-sm text-red-500">
              加载出错: {error}
            </div>
          ) : domains.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-500">
              没有可用域名
            </div>
          ) : (
            domains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 