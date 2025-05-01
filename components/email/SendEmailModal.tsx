"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Icons } from "../shared/icons";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Input } from "../ui/input";

import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface SendEmailModalProps {
  className?: string;
  emailAddress: string | null;
  triggerButton?: React.ReactNode; // 自定义触发按钮
  onSuccess?: () => void; // 发送成功后的回调
}

export function SendEmailModal({
  className,
  emailAddress,
  triggerButton,
  onSuccess,
}: SendEmailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ to: "", subject: "", html: "" });
  const [isPending, startTransition] = useTransition();

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error("未选择邮箱地址");
      return;
    }
    if (!sendForm.to || !sendForm.subject || !sendForm.html) {
      toast.error("请填写所有字段");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/email/send", {
          method: "POST",
          body: JSON.stringify({
            from: emailAddress,
            to: sendForm.to,
            subject: sendForm.subject,
            html: sendForm.html,
          }),
        });

        if (response.ok) {
          toast.success("邮件发送成功");
          setIsOpen(false);
          setSendForm({ to: "", subject: "", html: "" });
          onSuccess?.();
        } else {
          toast.error("邮件发送失败", {
            description: await response.text(),
          });
        }
      } catch (error) {
        toast.error(error.message || "发送邮件时出错");
      }
    });
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <Button
          className={`flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
          variant="default"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          <Icons.send size={14} />
          <span className="text-xs">发送</span>
        </Button>
      )}

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="fixed bottom-0 right-0 top-0 w-full rounded-none sm:max-w-xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-1">
              发送邮件{" "}
              <Icons.help className="size-5 text-neutral-600 hover:text-neutral-400" />
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" className="absolute right-4 top-4">
                <Icons.close className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="scrollbar-hidden h-[calc(100vh)] space-y-4 overflow-y-auto p-6">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                发件人
              </label>
              <Input value={emailAddress || ""} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                收件人
              </label>
              <Input
                value={sendForm.to}
                onChange={(e) =>
                  setSendForm({ ...sendForm, to: e.target.value })
                }
                placeholder="recipient@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                主题
              </label>
              <Input
                value={sendForm.subject}
                onChange={(e) =>
                  setSendForm({ ...sendForm, subject: e.target.value })
                }
                placeholder="输入邮件主题"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                内容
              </label>
              <ReactQuill
                value={sendForm.html}
                onChange={(value) => setSendForm({ ...sendForm, html: value })}
                className="mt-1 h-40 rounded-lg"
                theme="snow"
                placeholder="输入邮件内容"
              />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                取消
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSendEmail}
              disabled={isPending}
              variant="default"
            >
              {isPending ? "发送中..." : "发送"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
