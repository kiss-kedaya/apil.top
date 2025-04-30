import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "absolute left-4 top-4 md:left-8 md:top-8",
        )}
      >
        <>
          <Icons.chevronLeft className="mr-2 size-4" />
          Back
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto size-12" />
          <div className="text-2xl font-semibold tracking-tight">
            <span>Welcome to</span>{" "}
            <span style={{ fontFamily: "Bahamas Bold" }}>
              {siteConfig.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
          选择您的登录方式以继续
          </p>
        </div>
        <Suspense>
          <UserAuthForm />
        </Suspense>
        <p className="px-8 text-center text-sm text-muted-foreground">
        点击继续，即表示您同意我们的{" "}
          <Link
            href="/terms"
            className="hover:text-brand underline underline-offset-4"
          >
            服务条款
          </Link>{" "}
          和{" "}
          <Link
            href="/privacy"
            className="hover:text-brand underline underline-offset-4"
          >
            隐私政策
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
