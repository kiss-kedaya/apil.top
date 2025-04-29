<div align="center">
  <h1>kedaya.xyz</h1>
  <p><a href="https://discord.gg/AHPQYuZu3m">Discord</a> · English | <a href="/README-zh.md">简体中文</a></p>
  <p>Make Short Links, Manage DNS Records, Email Support.</p>
  <!-- <img src="https://kedaya.xyz/_static/images/light-preview.png"/> -->
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

![screenshot](https://kedaya.xyz/_static/images/light-preview.png)

![screenshot](https://kedaya.xyz/_static/images/example_02.png)

![screenshot](https://kedaya.xyz/_static/images/example_01.png)

![screenshot](https://kedaya.xyz/_static/images/example_03.png)

## Quick Start

See usage docs about [guide](https://kedaya.xyz/docs/quick-start) for quick start.

## Self-hosted Tutorial

See step by step installation tutorial at [Quick Start for Developer](https://kedaya.xyz/docs/developer/quick-start).

### Requirements

- [Vercel](https://vercel.com) to deploy app
- A **domain** name hosted on [Cloudflare](https://dash.cloudflare.com/)

See more docs about [developer](https://kedaya.xyz/docs/developer/installation).

### Email worker

See docs about [email worker](https://kedaya.xyz/docs/developer/cloudflare-email-worker).

## Local development

copy `.env.example` to `.env` and fill in the necessary environment variables.

```bash
git clone https://github.com/oiov/kedaya.xyz
cd kedaya.xyz
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

- Discord: https://discord.gg/AHPQYuZu3m

## License

[MIT](/LICENSE.md)

## Star History

<a href="https://star-history.com/#oiov/kedaya.xyz&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=oiov/kedaya.xyz&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=oiov/kedaya.xyz&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=oiov/kedaya.xyz&type=Date" />
 </picture>
</a>