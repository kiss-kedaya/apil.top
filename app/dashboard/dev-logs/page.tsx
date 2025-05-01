"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Log {
  id: string;
  level: string;
  message: string;
  details?: string;
  caller?: string;
  createdAt: string;
}

interface LogResponse {
  status: string;
  data: {
    logs: Log[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export default function DevLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [devToken, setDevToken] = useState<string>("");
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userInfo, setUserInfo] = useState<{id: string; isAdmin: boolean} | null>(null);

  // 检测是否为开发环境并获取当前用户信息
  useEffect(() => {
    // 获取当前用户信息
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
          setUserInfo({
            id: info.id,
            isAdmin: info.isAdmin
          });
          setCurrentUserId(info.id);
        }
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });

    // 设置开发选项
    if (process.env.NODE_ENV === "development") {
      setShowDevOptions(true);
    }
  }, []);

  // 获取日志
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      const url = new URL("/api/dev-logs", window.location.origin);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", "50");
      if (searchTerm) {
        url.searchParams.append("search", searchTerm);
      }
      if (level && level !== "all") {
        url.searchParams.append("level", level);
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // 如果有开发者令牌，添加到请求头
      if (devToken) {
        headers["x-dev-token"] = devToken;
      }

      const response = await fetch(url.toString(), { headers });
      
      if (response.status === 403) {
        if (userInfo?.isAdmin) {
          throw new Error("权限验证失败，但您的账号应该有管理员权限。请联系系统管理员检查数据库");
        } else {
          throw new Error("无权限访问开发日志，您需要管理员权限");
        }
      }
      
      if (!response.ok) {
        throw new Error(
          `获取日志失败: ${response.status} ${response.statusText}`,
        );
      }

      const data: LogResponse = await response.json();
      if (data.status === "success") {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(data.data.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 清空日志
  const clearLogs = async (all: boolean = false) => {
    if (!confirm(all ? "确定要清空所有日志吗？" : "确定要清理过期日志吗？")) {
      return;
    }

    try {
      setLoading(true);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // 如果有开发者令牌，添加到请求头
      if (devToken) {
        headers["x-dev-token"] = devToken;
      }

      const response = await fetch("/api/dev-logs", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ all }),
      });

      if (!response.ok) {
        throw new Error("清空日志失败");
      }

      const data = await response.json();
      if (data.status === "success") {
        alert(data.data.message);
        fetchLogs();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  // 当页码、搜索词、级别变化时重新获取日志
  useEffect(() => {
    fetchLogs();
  }, [page, level]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // 获取日志级别标记的颜色
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">错误</Badge>;
      case "warn":
        return (
          <Badge variant="default" className="bg-yellow-500">
            警告
          </Badge>
        );
      case "info":
        return <Badge variant="outline">信息</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 美化JSON显示
  const formatJSON = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">开发日志</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearLogs(false)}
              disabled={loading}
            >
              清理过期
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearLogs(true)}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清空所有
            </Button>
          </div>
        </div>

        {userInfo && !userInfo.isAdmin && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-900/20">
            <h3 className="mb-2 font-medium">您不是管理员</h3>
            <p className="text-sm">
              您的用户ID: <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">{userInfo.id}</code>
            </p>
            <p className="mt-2 text-sm">
              请前往管理员设置页面，将您的用户ID设置为管理员，或联系已有管理员进行设置。
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => (window.location.href = "/dashboard/admin")}
            >
              前往管理员设置
            </Button>
          </div>
        )}

        {showDevOptions && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <h3 className="mb-2 font-medium">开发模式</h3>
            <div className="flex gap-2">
              <Input
                placeholder="开发者令牌"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDevToken("dev-admin-access");
                  setTimeout(() => fetchLogs(), 100);
                }}
              >
                使用开发令牌
              </Button>
            </div>
            {currentUserId && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  当前用户ID:{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
                    {currentUserId}
                  </code>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => (window.location.href = "/dashboard/admin")}
                >
                  前往管理员设置
                </Button>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              在开发环境中，可以使用特殊令牌绕过管理员权限检查。
            </p>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="搜索日志内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="所有级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有级别</SelectItem>
              <SelectItem value="info">信息</SelectItem>
              <SelectItem value="warn">警告</SelectItem>
              <SelectItem value="error">错误</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            搜索
          </Button>
        </form>

        {error && <div className="text-red-500">{error}</div>}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">级别</TableHead>
              <TableHead className="w-32">时间</TableHead>
              <TableHead>消息</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            )}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  暂无日志
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <TableCell>{getLevelBadge(log.level)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {log.message}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    详情
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">共 {totalPages} 页</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || loading}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 日志详情对话框 */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLevelBadge(selectedLog.level)}
              <span>日志详情</span>
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">详情</TabsTrigger>
                <TabsTrigger value="caller">调用堆栈</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-1 text-sm font-semibold">消息</h4>
                    <div className="rounded-md border bg-gray-50 p-2 dark:bg-gray-900">
                      {selectedLog.message}
                    </div>
                  </div>
                  {selectedLog.details && (
                    <div>
                      <h4 className="mb-1 text-sm font-semibold">详细信息</h4>
                      <pre className="max-h-96 overflow-auto rounded-md border bg-gray-50 p-2 text-xs dark:bg-gray-900">
                        {formatJSON(selectedLog.details)}
                      </pre>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="caller" className="mt-4">
                <div>
                  <h4 className="mb-1 text-sm font-semibold">调用堆栈</h4>
                  <pre className="max-h-96 overflow-auto rounded-md border bg-gray-50 p-2 font-mono text-xs dark:bg-gray-900">
                    {selectedLog.caller || "无堆栈信息"}
                  </pre>
                </div>
              </TabsContent>
              <TabsContent value="json" className="mt-4">
                <pre className="max-h-96 overflow-auto rounded-md border bg-gray-50 p-2 text-xs dark:bg-gray-900">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
