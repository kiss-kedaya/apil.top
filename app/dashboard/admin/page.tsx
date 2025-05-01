"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; isAdmin: boolean} | null>(null);

  // 获取当前用户信息
  useEffect(() => {
    fetch("/api/user/info")
      .then((res) => {
        if(!res.ok && res.status === 401) {
          return null; // 用户未登录
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.status === "success") {
          const info = data.data;
          setCurrentUser({
            id: info.id,
            isAdmin: info.isAdmin
          });
          // 如果未填写ID，自动填入当前用户ID
          if(!userId) {
            setUserId(info.id);
          }
        }
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });
  }, []);

  const setUserAsAdmin = async () => {
    if (!userId.trim()) {
      toast.error("请输入用户ID");
      return;
    }

    try {
      setLoading(true);

      // 这里只是示例，实际需要创建一个专门的API端点
      const response = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 在开发环境可以使用开发者令牌
          "x-dev-token":
            process.env.NODE_ENV === "development" ? "dev-admin-access" : "",
        },
        body: JSON.stringify({
          userId,
          role: "ADMIN",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "设置管理员失败");
      }

      const data = await response.json();
      toast.success("用户已设置为管理员");
      setUserId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">管理员设置</h1>

      {currentUser && currentUser.isAdmin && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 p-3 dark:bg-green-900/20">
          <h3 className="mb-2 font-medium">您已拥有管理员权限</h3>
          <p className="text-sm">
            您的用户ID:{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
              {currentUser.id}
            </code>
          </p>
          <p className="mt-1 text-sm">
            您现在可以访问所有管理功能，包括开发日志和用户管理。
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => (window.location.href = "/dashboard/dev-logs")}
          >
            前往开发日志
          </Button>
        </div>
      )}

      {currentUser && !currentUser.isAdmin && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-900/20">
          <h3 className="mb-2 font-medium">您不是管理员</h3>
          <p className="text-sm">
            您的用户ID:{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
              {currentUser.id}
            </code>
          </p>
          <p className="mt-1 text-sm">
            已自动填入您的用户ID，点击下方按钮将自己设置为管理员。
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>设置管理员</CardTitle>
            <CardDescription>
              将指定用户设置为管理员。管理员可以访问系统日志等敏感功能。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="user-id">用户ID</label>
                <Input
                  id="user-id"
                  placeholder="输入用户的ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={setUserAsAdmin}
              disabled={loading || !userId.trim()}
            >
              {loading ? "处理中..." : "设置为管理员"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>临时访问开发日志</CardTitle>
            <CardDescription>
              在开发环境中，可以使用特殊令牌临时访问开发日志。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              在开发环境中打开日志页面，使用令牌{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
                dev-admin-access
              </code>{" "}
              可以临时访问日志。
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/dev-logs")}
            >
              前往日志页面
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500">
          注意：管理员权限授予全部系统访问权限，请谨慎操作。
        </p>
      </div>
    </div>
  );
}
