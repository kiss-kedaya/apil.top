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
