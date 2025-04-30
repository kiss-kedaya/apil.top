import "@/styles/globals.css";

import { fontHeading, fontSans, fontSatoshi } from "@/assets/fonts";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";

import { cn, constructMetadata } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ModalProvider from "@/components/modals/providers";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { RedirectProtection } from "@/components/redirect-protection";

import GoogleAnalytics from "./GoogleAnalytics";

interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata = constructMetadata();

export default function RootLayout({ children }: RootLayoutProps) {
  // 重置客户端导航状态，防止重定向循环
  if (typeof window !== 'undefined') {
    // 检测是否存在重定向循环
    const redirectCount = sessionStorage.getItem('redirectCount');
    const currentPath = window.location.pathname;
    
    // 如果检测到文档路径访问超过一定次数，重置导航状态
    if (currentPath.includes('/docs/') && redirectCount && parseInt(redirectCount) > 3) {
      sessionStorage.removeItem('redirectCount');
      // 如果存在循环,强制刷新清除状态
      window.location.href = currentPath;
    } else if (currentPath.includes('/docs/')) {
      sessionStorage.setItem('redirectCount', redirectCount ? (parseInt(redirectCount) + 1).toString() : '1');
    } else {
      sessionStorage.removeItem('redirectCount');
    }
  }

  return (
    <ViewTransitions>
      <html lang="zh" suppressHydrationWarning>
        <head>
        <meta name="msvalidate.01" content="BF59BE2A2C5F2BA5FC7EC55065C92054" />
          <meta name="baidu-site-verification" content="codeva-MNllrVQA3g" />
        </head>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
            fontHeading.variable,
            fontSatoshi.variable,
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <RedirectProtection />
            <SessionProvider>
              <ModalProvider>{children}</ModalProvider>
            </SessionProvider>
            <Toaster position="bottom-right" />
            <TailwindIndicator />
          </ThemeProvider>
          <GoogleAnalytics />
        </body>
      </html>
    </ViewTransitions>
  );
}
