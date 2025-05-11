import type { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { env } from "@/env.mjs";

import { siteConfig } from "./config/site";
import { getVerificationEmailHtml, resend } from "./lib/email";

export default {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: "wrdo <kedaya0226@qq.com>",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        try {
          const { error } = await resend.emails.send({
            from: provider.from || "no-reply@qali.cn",
            to: [email],
            subject: "Verify your email address",
            html: getVerificationEmailHtml({ url, appName: siteConfig.name }),
          });

          if (error) {
            throw new Error(`Resend error: ${JSON.stringify(error)}`);
          }
        } catch (error) {
          console.error("Error sending verification email", error);
          throw new Error("Error sending verification email");
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
