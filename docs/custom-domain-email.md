# 自定义域名邮箱功能文档

## 概述

自定义域名邮箱功能允许用户使用已验证的自定义域名发送和接收电子邮件。该功能包括以下核心组件：

1. SMTP服务配置 - 用于发送邮件
2. DNS记录验证 - 确保正确的MX, SPF, DKIM和DMARC记录
3. 邮箱服务状态监控 - 监控邮箱服务的可用性和健康状况

## 数据库结构

自定义域名表(`user_custom_domains`)新增以下字段：

| 字段名 | 类型 | 描述 |
|------|------|------|
| enableEmail | BOOLEAN | 是否启用邮箱服务 |
| emailVerified | BOOLEAN | 邮箱配置是否验证通过 |
| smtpServer | VARCHAR | SMTP服务器地址 |
| smtpPort | INTEGER | SMTP服务器端口 |
| smtpUsername | VARCHAR | SMTP账号用户名 |
| smtpPassword | VARCHAR | SMTP账号密码 |
| fromEmail | VARCHAR | 发件人邮箱地址 |

## 后端API端点

### 1. 配置邮箱服务

- **URL**: `/api/custom-domain/email`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "id": "域名ID",
    "smtpServer": "smtp.example.com",
    "smtpPort": 587,
    "smtpUsername": "user@example.com",
    "smtpPassword": "password",
    "fromEmail": "noreply@yourdomain.com"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "域名ID",
      "domainName": "example.com",
      "enableEmail": true,
      "emailVerified": false,
      "smtpServer": "smtp.example.com",
      "smtpPort": 587,
      "smtpUsername": "user@example.com",
      "fromEmail": "noreply@yourdomain.com"
    }
  }
  ```

### 2. 验证邮箱配置

- **URL**: `/api/custom-domain/email`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "id": "域名ID"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "域名ID",
      "domainName": "example.com",
      "enableEmail": true,
      "emailVerified": true
    }
  }
  ```

### 3. 验证邮箱DNS记录

- **URL**: `/api/custom-domain/email/dns`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "id": "域名ID"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "mx": {
        "success": true,
        "details": {
          "mxRecords": [
            {"priority": 10, "exchange": "mail.example.com"}
          ]
        }
      },
      "spf": {
        "success": true,
        "details": {
          "spfRecord": "v=spf1 include:_spf.example.com ~all"
        }
      },
      "dkim": {
        "success": true,
        "details": {
          "dkimRecord": "v=DKIM1; k=rsa; p=MIIBIjANB..."
        }
      },
      "dmarc": {
        "success": true,
        "details": {
          "dmarcRecord": "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
        }
      }
    }
  }
  ```

### 4. 获取邮箱服务状态

- **URL**: `/api/custom-domain/email/status?id=域名ID`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "enabled": true,
      "verified": true,
      "smtpConfigured": true,
      "dnsStatus": {
        "mx": {"success": true},
        "spf": {"success": true},
        "dkim": {"success": true},
        "dmarc": {"success": true}
      }
    }
  }
  ```

## DNS记录配置指南

用户需要添加以下DNS记录到他们的域名解析服务商：

### MX记录

MX（Mail Exchange）记录用于指定负责接收发送到该域名的电子邮件的服务器。

| 主机记录 | 记录类型 | 优先级 | 记录值 |
|--------|--------|--------|--------|
| @ | MX | 10 | mail.yourmailserver.com |

### SPF记录

SPF（Sender Policy Framework）是一种电子邮件验证标准，用于防止欺骗邮件。

| 主机记录 | 记录类型 | 记录值 |
|--------|--------|--------|
| @ | TXT | v=spf1 include:_spf.yourmailserver.com ~all |

### DKIM记录

DKIM（DomainKeys Identified Mail）为电子邮件提供了一种验证其来源真实性和完整性的方法。

| 主机记录 | 记录类型 | 记录值 |
|--------|--------|--------|
| default._domainkey | TXT | v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY |

### DMARC记录

DMARC（Domain-based Message Authentication, Reporting & Conformance）定义了收件人处理SPF或DKIM验证失败的邮件的方式。

| 主机记录 | 记录类型 | 记录值 |
|--------|--------|--------|
| _dmarc | TXT | v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com |

## 前端组件

主要前端组件`EmailConfigSection.tsx`提供以下功能：

1. 邮箱服务启用/禁用开关
2. SMTP服务配置表单
3. DNS记录配置指南
4. 服务状态监控面板

## 实现注意事项

1. **安全性**：SMTP密码存储应加密
2. **错误处理**：详细的错误信息和辅助提示
3. **验证流程**：分步验证,引导用户完成所有配置

## 使用示例

```jsx
import EmailConfigSection from "@/app/components/EmailConfigSection";

export default function CustomDomainPage() {
  const domain = {/* 域名数据 */};
  
  const handleUpdate = async (data) => {
    // 更新域名信息
  };
  
  const handleConfigureEmail = async (data) => {
    // 配置邮箱服务
  };
  
  return (
    <div>
      <h1>自定义域名</h1>
      <EmailConfigSection 
        domain={domain}
        onUpdate={handleUpdate}
        onVerify={/* 验证域名 */}
        onConfigureEmail={handleConfigureEmail}
        onVerifyEmailConfig={/* 验证邮箱配置 */}
        onVerifyEmailDNS={/* 验证DNS记录 */}
        onGetEmailStatus={/* 获取邮箱状态 */}
      />
    </div>
  );
}
``` 