"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, Trash2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [copiedCaller, setCopiedCaller] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedFullLog, setCopiedFullLog] = useState(false);

  // 获取日志
  const fetchLogs = useCallback(async () => {
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

      const response = await fetch(url.toString());
      if (response.status === 403) {
        throw new Error("无权限访问开发日志，请确认您拥有管理员权限");
      }
      if (!response.ok) {
        throw new Error(`获取日志失败: ${response.status} ${response.statusText}`);
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
  }, [page, level, searchTerm]);

  // 清空日志
  const clearLogs = async (all: boolean = false) => {
    if (!confirm(all ? "确定要清空所有日志吗？" : "确定要清理过期日志吗？")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/dev-logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
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
  }, [page, level, fetchLogs]);

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
        return <Badge variant="default" className="bg-yellow-500">警告</Badge>;
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

  // 复制文本到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (type === 'details') {
          setCopiedDetails(true);
          setTimeout(() => setCopiedDetails(false), 2000);
        } else if (type === 'caller') {
          setCopiedCaller(true);
          setTimeout(() => setCopiedCaller(false), 2000);
        } else if (type === 'json') {
          setCopiedJson(true);
          setTimeout(() => setCopiedJson(false), 2000);
        }
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  // 复制整个日志的函数
  const copyFullLog = (log: Log) => {
    if (!log) return;
    
    const logContent = JSON.stringify({
      id: log.id,
      level: log.level,
      message: log.message,
      details: log.details,
      caller: log.caller,
      createdAt: log.createdAt
    }, null, 2);
    
    navigator.clipboard.writeText(logContent)
      .then(() => {
        setCopiedFullLog(true);
        setTimeout(() => setCopiedFullLog(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-xl font-bold">开发日志查看器</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearLogs(false)}
            disabled={loading || logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清理过期日志
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => clearLogs(true)}
            disabled={loading || logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清空所有日志
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <Input
          type="text"
          placeholder="搜索日志..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="日志级别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有级别</SelectItem>
            <SelectItem value="info">信息</SelectItem>
            <SelectItem value="warn">警告</SelectItem>
            <SelectItem value="error">错误</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fetchLogs()}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </form>

      {error && <div className="text-red-500 p-4 border border-red-200 rounded-md">{error}</div>}

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">没有找到日志</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">级别</TableHead>
                <TableHead>消息</TableHead>
                <TableHead className="w-[200px]">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>{getLevelBadge(log.level)}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[400px]">
                    {log.message}
                  </TableCell>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          第 {page} 页，共 {totalPages} 页
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="max-w-4xl">
            <DialogHeader className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {getLevelBadge(selectedLog.level)}
                  <span>日志详情</span>
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selectedLog.createdAt)}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyFullLog(selectedLog)}
                className="shrink-0"
              >
                {copiedFullLog ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                复制日志
              </Button>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">详细信息</TabsTrigger>
                <TabsTrigger value="caller">调用者</TabsTrigger>
                <TabsTrigger value="json">JSON格式</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-semibold">消息</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedLog.message, 'details')}
                  >
                    {copiedDetails ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60 font-mono text-xs break-all whitespace-pre-wrap">
                  {selectedLog.message}
                </div>

                {selectedLog.details && (
                  <>
                    <h3 className="text-lg font-semibold mt-4">附加详情</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-80 font-mono text-xs break-all whitespace-pre-wrap">
                      {formatJSON(selectedLog.details)}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="caller" className="mt-4">
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-semibold">调用栈信息</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedLog.caller || '', 'caller')}
                  >
                    {copiedCaller ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-80 font-mono text-xs break-all whitespace-pre-wrap">
                  {selectedLog.caller || '无调用栈信息'}
                </div>
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-semibold">原始JSON</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), 'json')}
                  >
                    {copiedJson ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] font-mono text-xs break-all whitespace-pre-wrap">
                  {JSON.stringify(selectedLog, null, 2)}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 