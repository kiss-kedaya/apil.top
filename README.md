<div align="center">
  <h1>apil.top</h1>
  <p><a href="https://t.me/TGG798">Telegram</a> · English | <a href="/README-zh.md">简体中文</a></p>
  <p>Make Short Links, Manage DNS Records, Email Support.</p>
  <!-- <img src="https://apil.top/_static/images/light-preview.png"/> -->
</div>

## Features

- 🔗 **URL Shortening:** Generate short links with visitor analytic and password(support api)
- 📮 **Email Support:** Receive emails and send emails(support api)
- 💬 **P2P Chat:** Start chat in seconds
- 🌐 **Multi-Tenant Support:** Manage multiple DNS records seamlessly
- 📸 **Screenshot API:** Access to screenshot api、website meta-info scraping api.
- 😀 **Permission Management:** A convenient admin panel for auditing
- 🔒 **Secure & Reliable:** Built on Cloudflare's robust DNS API

## Screenshots

![screenshot](https://apil.top/_static/images/light-preview.png)

![screenshot](https://apil.top/_static/images/example_02.png)

![screenshot](https://apil.top/_static/images/example_01.png)

![screenshot](https://apil.top/_static/images/example_03.png)

## Quick Start

See usage docs about [guide](https://apil.top/docs/quick-start) for quick start.

## Self-hosted Tutorial

See step by step installation tutorial at [Quick Start for Developer](https://apil.top/docs/developer/quick-start).

### Requirements

- [Vercel](https://vercel.com) to deploy app
- A **domain** name hosted on [Cloudflare](https://dash.cloudflare.com/)

See more docs about [developer](https://apil.top/docs/developer/installation).

### Email worker

See docs about [email worker](https://apil.top/docs/developer/cloudflare-email-worker).

## Local development

copy `.env.example` to `.env` and fill in the necessary environment variables.

```bash
git clone https://github.com/kiss-kedaya/apil.top
cd apil.top
pnpm install

# run on localhost:3000
pnpm dev
```

## Legitimacy review

- To avoid abuse, applications without website content will be rejected
- To avoid domain name conflicts, please check before applying
- Completed website construction or released open source project (ready to build website for open source project)
- Political sensitivity, violence, pornography, link jumping, VPN, reverse proxy services, and other illegal or sensitive content must not appear on the website

**Administrators will conduct domain name checks periodically to clean up domain names that violate the above rules, have no content, and are not open source related**

## Community Group

- Telegram: https://t.me/TGG798

## License

[MIT](/LICENSE.md)

## Star History

<a href="https://star-history.com/#kiss-kedaya/apil.top&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kiss-kedaya/apil.top&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kiss-kedaya/apil.top&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=kiss-kedaya/apil.top&type=Date" />
 </picture>
</a>

## Database Migration

If you encounter errors related to database table structure, such as "column enableEmail of relation user_custom_domains does not exist", you need to perform a database migration:

1. Ensure Prisma is installed: `pnpm add -D prisma`
2. Run Prisma migration commands:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

This will update your database structure according to the Prisma schema.

## 自定义域名配置

本项目支持用户添加自定义域名并自动绑定到Vercel项目。要启用此功能，请在您的`.env.local`文件中添加以下配置：

```
VERCEL_TOKEN=您的Vercel个人访问令牌
VERCEL_PROJECT_NAME=您的Vercel项目名称
```

### 获取Vercel访问令牌

1. 登录到您的Vercel账户
2. 访问 https://vercel.com/account/tokens
3. 点击"Create"创建新令牌
4. 设置一个描述性名称，如"自定义域名集成"
5. 选择"Full Account"权限
6. 点击"Create Token"并复制生成的令牌

### 获取项目名称

项目名称是Vercel部署URL中的名称部分。例如，如果您的部署URL是`https://my-project-123.vercel.app`，则项目名称为`my-project-123`。

## Custom Domain Configuration

This project supports adding custom domains and automatically binding them to your Vercel project. To enable this feature, add the following to your `.env.local` file:

```
VERCEL_TOKEN=your_vercel_personal_access_token
VERCEL_PROJECT_NAME=your_vercel_project_name
```

### Getting a Vercel Access Token

1. Log in to your Vercel account
2. Go to https://vercel.com/account/tokens
3. Click "Create" to create a new token
4. Set a descriptive name like "Custom Domain Integration"
5. Select "Full Account" permissions
6. Click "Create Token" and copy the generated token

### Getting Project Name

The project name is the name part of your Vercel deployment URL. For example, if your deployment URL is `https://my-project-123.vercel.app`, then the project name is `my-project-123`.

### Custom Domain Email Service

The project now features a simplified email service for custom domains:

1. Users only need to add basic DNS records (MX and SPF)
2. No need to deploy any Cloudflare Workers or complex configurations
3. Email services are pre-deployed and ready to use
4. Users can create email addresses with their custom domains immediately after DNS configuration

This simplification makes it much easier for users to benefit from custom domain email services, enhancing the overall user experience.