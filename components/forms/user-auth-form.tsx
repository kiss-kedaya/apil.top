"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { userAuthSchema } from "@/lib/validations/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
}

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({ className, type, ...props }: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const [isGithubLoading, setIsGithubLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const signInResult = await signIn("resend", {
        email: data.email.toLowerCase(),
        redirect: false,
        callbackUrl: searchParams?.get("from") || "/dashboard",
      });

      if (!signInResult?.ok) {
        const errorDescription = signInResult?.error?.includes("domain is not verified") ? 
          "不支持当前邮箱域名，请使用其他邮箱" : 
          "您的登录请求失败。请重试。";
        
        throw new Error(errorDescription);
      }

      toast.success("检查您的邮箱", {
        description: "我们已发送登录链接。请同时检查垃圾邮件。",
      });
    } catch (error) {
      toast.error("出错了", {
        description: error instanceof Error ? error.message : "您的登录请求失败。请重试。",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => {
          setIsGoogleLoading(true);
          signIn("google");
        }}
        disabled={
          !siteConfig.openSignup ||
          isLoading ||
          isGoogleLoading ||
          isGithubLoading
        }
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 size-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 size-4" />
        )}{" "}
        Google
      </button>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => {
          setIsGithubLoading(true);
          signIn("github");
        }}
        disabled={
          !siteConfig.openSignup ||
          isLoading ||
          isGithubLoading ||
          isGoogleLoading
        }
      >
        {isGithubLoading ? (
          <Icons.spinner className="mr-2 size-4 animate-spin" />
        ) : (
          <Icons.github className="mr-2 size-4" />
        )}{" "}
        Github
      </button>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            或继续使用
          </span>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              邮箱
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
            <p className="px-1 text-xs text-muted-foreground">
              注意：目前不支持QQ邮箱注册/登录
            </p>
          </div>
          <button
            className={cn(buttonVariants(), "mt-3")}
            disabled={
              !siteConfig.openSignup ||
              isLoading ||
              isGoogleLoading ||
              isGithubLoading
            }
          >
            {isLoading && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            {type === "register" ? "使用邮箱注册" : "使用邮箱登录"}
          </button>
        </div>
      </form>
    </div>
  );
}
