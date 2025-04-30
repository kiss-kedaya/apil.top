"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

interface EmailConfigProps {
  domain: any;
  onUpdate: (data: any) => Promise<any>;
  onVerify: (id: string) => Promise<any>;
  onConfigureEmail: (data: any) => Promise<any>;
  onVerifyEmailConfig: (id: string) => Promise<any>;
  onVerifyEmailDNS: (id: string) => Promise<any>;
  onGetEmailStatus: (id: string) => Promise<any>;
}

export default function EmailConfigSection({
  domain,
  onUpdate,
  onVerify,
  onConfigureEmail,
  onVerifyEmailConfig,
  onVerifyEmailDNS,
  onGetEmailStatus,
}: EmailConfigProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(domain?.enableEmail || false);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [smtpConfig, setSmtpConfig] = useState({
    id: domain?.id || "",
    smtpServer: domain?.smtpServer || "",
    smtpPort: domain?.smtpPort || 587,
    smtpUsername: domain?.smtpUsername || "",
    smtpPassword: domain?.smtpPassword || "",
    fromEmail: domain?.fromEmail || "",
  });

  // 处理邮箱开关
  const handleToggleEmail = async () => {
    try {
      setLoading("toggle");
      const newEnabledState = !emailEnabled;
      setEmailEnabled(newEnabledState);
      
      const result = await onUpdate({
        id: domain.id,
        enableEmail: newEnabledState,
      });
      
      if (result.status === "success") {
        toast.success(newEnabledState ? "邮箱服务已启用" : "邮箱服务已禁用");
        
        if (newEnabledState) {
          // 更新状态
          const statusResult = await onGetEmailStatus(domain.id);
          if (statusResult.status === "success") {
            setEmailStatus(statusResult.data);
          }
        }
      } else {
        toast.error(result.message || "操作失败");
        setEmailEnabled(!newEnabledState); // 还原状态
      }
    } catch (error) {
      toast.error("操作过程中发生错误");
      setEmailEnabled(!emailEnabled); // 还原状态
    } finally {
      setLoading(null);
    }
  };

  // 更新SMTP配置
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSmtpConfig(prev => ({
      ...prev,
      [name]: name === "smtpPort" ? parseInt(value) || "" : value,
    }));
  };

  // 保存SMTP配置
  const handleSaveSmtpConfig = async () => {
    try {
      setLoading("smtp");
      
      const result = await onConfigureEmail(smtpConfig);
      
      if (result.status === "success") {
        toast.success("SMTP配置已保存");
        
        // 更新状态
        const statusResult = await onGetEmailStatus(domain.id);
        if (statusResult.status === "success") {
          setEmailStatus(statusResult.data);
        }
      } else {
        toast.error(result.message || "保存失败");
      }
    } catch (error) {
      toast.error("保存过程中发生错误");
    } finally {
      setLoading(null);
    }
  };

  // 验证SMTP配置
  const handleVerifySmtp = async () => {
    try {
      setLoading("verifySmtp");
      
      const result = await onVerifyEmailConfig(domain.id);
      
      if (result.status === "success") {
        toast.success("SMTP配置验证成功");
        
        // 更新状态
        const statusResult = await onGetEmailStatus(domain.id);
        if (statusResult.status === "success") {
          setEmailStatus(statusResult.data);
        }
      } else {
        toast.error(result.message || "验证失败");
      }
    } catch (error) {
      toast.error("验证过程中发生错误");
    } finally {
      setLoading(null);
    }
  };

  // 验证DNS记录
  const handleVerifyDns = async () => {
    try {
      setLoading("verifyDns");
      
      const result = await onVerifyEmailDNS(domain.id);
      
      if (result.status === "success") {
        toast.success("DNS记录验证成功");
        setEmailStatus(prev => ({
          ...prev,
          dnsStatus: result.data,
        }));
      } else {
        toast.error(result.message || "验证失败");
      }
    } catch (error) {
      toast.error("验证过程中发生错误");
    } finally {
      setLoading(null);
    }
  };

  // 加载邮箱状态
  const handleLoadStatus = async () => {
    try {
      setLoading("status");
      
      const result = await onGetEmailStatus(domain.id);
      
      if (result.status === "success") {
        setEmailStatus(result.data);
      } else {
        toast.error(result.message || "获取状态失败");
      }
    } catch (error) {
      toast.error("获取状态过程中发生错误");
    } finally {
      setLoading(null);
    }
  };

  // 首次加载
  const loadInitialStatus = async () => {
    if (domain?.enableEmail && !emailStatus) {
      handleLoadStatus();
    }
  };

  // 域名未验证时禁用所有功能
  const isDomainVerified = domain?.isVerified === true;

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          邮箱服务配置
        </CardTitle>
        <CardDescription>
          配置您的自定义域名用于发送和接收电子邮件
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isDomainVerified && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>域名未验证</AlertTitle>
            <AlertDescription>
              请先完成域名所有权验证，然后再配置邮箱服务
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <Label htmlFor="email-enabled" className="text-base">启用邮箱服务</Label>
            <p className="text-sm text-gray-500">
              开启后，您可以通过此域名发送和接收电子邮件
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={handleToggleEmail}
              disabled={loading === "toggle" || !isDomainVerified}
            />
            {loading === "toggle" && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </div>
        </div>
        
        {emailEnabled && (
          <Tabs defaultValue="smtp" className="mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="smtp">SMTP配置</TabsTrigger>
              <TabsTrigger value="dns">DNS记录</TabsTrigger>
              <TabsTrigger value="status" onClick={handleLoadStatus}>状态检查</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smtp">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="smtpServer">SMTP服务器</Label>
                  <Input
                    id="smtpServer"
                    name="smtpServer"
                    value={smtpConfig.smtpServer}
                    onChange={handleInputChange}
                    placeholder="例如：smtp.example.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="smtpPort">SMTP端口</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    value={smtpConfig.smtpPort}
                    onChange={handleInputChange}
                    placeholder="例如：587"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="smtpUsername">SMTP用户名</Label>
                  <Input
                    id="smtpUsername"
                    name="smtpUsername"
                    value={smtpConfig.smtpUsername}
                    onChange={handleInputChange}
                    placeholder="邮箱用户名"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="smtpPassword">SMTP密码</Label>
                  <Input
                    id="smtpPassword"
                    name="smtpPassword"
                    type="password"
                    value={smtpConfig.smtpPassword}
                    onChange={handleInputChange}
                    placeholder="邮箱密码或应用密码"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="fromEmail">发件人邮箱</Label>
                  <Input
                    id="fromEmail"
                    name="fromEmail"
                    value={smtpConfig.fromEmail}
                    onChange={handleInputChange}
                    placeholder="例如：noreply@yourdomain.com"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={handleSaveSmtpConfig} 
                  disabled={loading === "smtp"}
                >
                  {loading === "smtp" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存配置
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleVerifySmtp}
                  disabled={loading === "verifySmtp" || !domain?.smtpServer}
                >
                  {loading === "verifySmtp" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  测试连接
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="dns">
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>DNS记录配置指南</AlertTitle>
                  <AlertDescription>
                    您需要添加以下DNS记录到您的域名解析服务商，以确保邮件服务正常工作
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">MX记录</h3>
                    <code className="block bg-gray-100 p-2 rounded">
                      主机记录: @<br/>
                      记录类型: MX<br/>
                      优先级: 10<br/>
                      记录值: mail.yourmailserver.com
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">SPF记录 (TXT记录)</h3>
                    <code className="block bg-gray-100 p-2 rounded">
                      主机记录: @<br/>
                      记录类型: TXT<br/>
                      记录值: v=spf1 include:_spf.yourmailserver.com ~all
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">DKIM记录 (TXT记录)</h3>
                    <code className="block bg-gray-100 p-2 rounded">
                      主机记录: default._domainkey<br/>
                      记录类型: TXT<br/>
                      记录值: v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">DMARC记录 (TXT记录)</h3>
                    <code className="block bg-gray-100 p-2 rounded">
                      主机记录: _dmarc<br/>
                      记录类型: TXT<br/>
                      记录值: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
                    </code>
                  </div>
                </div>
                
                <Button 
                  onClick={handleVerifyDns}
                  disabled={loading === "verifyDns"}
                >
                  {loading === "verifyDns" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  验证DNS记录
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="status">
              <div className="space-y-4">
                {loading === "status" ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : emailStatus ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500">邮箱服务</div>
                        <div className="flex items-center mt-1">
                          <Badge 
                            className="mr-2"
                          >
                            {emailStatus.enabled ? "已启用" : "已禁用"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500">SMTP配置</div>
                        <div className="flex items-center mt-1">
                          <Badge 
                            className="mr-2"
                          >
                            {emailStatus.smtpConfigured ? "已配置" : "未配置"}
                          </Badge>
                          {emailStatus.verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </div>
                    
                    {emailStatus.dnsStatus && (
                      <div>
                        <h3 className="font-medium mb-2">DNS记录状态</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center bg-gray-50 p-2 rounded">
                            <Badge 
                              variant={emailStatus.dnsStatus.mx?.success ? "default" : "destructive"}
                              className="mr-2"
                            >
                              MX
                            </Badge>
                            {emailStatus.dnsStatus.mx?.success 
                              ? <span className="text-green-500 text-sm">正常</span>
                              : <span className="text-red-500 text-sm">{emailStatus.dnsStatus.mx?.message}</span>
                            }
                          </div>
                          
                          <div className="flex items-center bg-gray-50 p-2 rounded">
                            <Badge 
                              variant={emailStatus.dnsStatus.spf?.success ? "default" : "destructive"}
                              className="mr-2"
                            >
                              SPF
                            </Badge>
                            {emailStatus.dnsStatus.spf?.success 
                              ? <span className="text-green-500 text-sm">正常</span>
                              : <span className="text-red-500 text-sm">{emailStatus.dnsStatus.spf?.message}</span>
                            }
                          </div>
                          
                          <div className="flex items-center bg-gray-50 p-2 rounded">
                            <Badge 
                              variant={emailStatus.dnsStatus.dkim?.success ? "default" : "destructive"}
                              className="mr-2"
                            >
                              DKIM
                            </Badge>
                            {emailStatus.dnsStatus.dkim?.success 
                              ? <span className="text-green-500 text-sm">正常</span>
                              : <span className="text-red-500 text-sm">{emailStatus.dnsStatus.dkim?.message}</span>
                            }
                          </div>
                          
                          <div className="flex items-center bg-gray-50 p-2 rounded">
                            <Badge 
                              variant={emailStatus.dnsStatus.dmarc?.success ? "default" : "destructive"}
                              className="mr-2"
                            >
                              DMARC
                            </Badge>
                            {emailStatus.dnsStatus.dmarc?.success 
                              ? <span className="text-green-500 text-sm">正常</span>
                              : <span className="text-red-500 text-sm">{emailStatus.dnsStatus.dmarc?.message}</span>
                            }
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {emailStatus.dnsError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>DNS验证错误</AlertTitle>
                        <AlertDescription>
                          {emailStatus.dnsError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={handleLoadStatus}
                      disabled={loading === "status"}
                    >
                      刷新状态
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">点击"刷新状态"按钮获取最新状态</p>
                    <Button 
                      variant="outline" 
                      onClick={handleLoadStatus}
                      className="mt-2"
                    >
                      刷新状态
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 