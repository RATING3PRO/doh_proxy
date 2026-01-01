# Secure DoH Proxy for Cloudflare Pages

A privacy-focused, multi-upstream DNS over HTTPS (DoH) proxy built with Next.js App Router and deployed on Cloudflare Pages.

## Features

- 🚀 **Edge Powered**: Runs on Cloudflare's global network for sub-millisecond latency.
- 🛡️ **Multi-Upstream**: Support for Cloudflare, Google, AliDNS, DNSPod, and Custom upstream.
- 🔍 **DNS Tester**: Built-in beautiful UI to test DNS resolution across different providers.
- 🔒 **Privacy First**: No logs, stateless proxying.
- 💅 **Modern UI**: Built with Tailwind CSS and Lucide Icons.

## Deploy to Cloudflare Pages

### Option 1: One-Click Deploy (Git)

1. Fork this repository.
2. Go to Cloudflare Dashboard > Pages > Create a project > Connect to Git.
3. Select your repository.
4. Configure the build settings:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npx @cloudflare/next-on-pages@1`
   - **Build Output Directory**: `.vercel/output/static`
   - **Node.js Version**: `20.x` or higher.
5. (Important) Ensure **Compatibility flags** includes `nodejs_compat`. 
   > The project includes a `wrangler.toml` which should automatically configure this, but if deployment fails, check **Settings** > **Build & deployments** > **Compatibility flags** in Cloudflare Dashboard.

### Option 2: CLI Deploy

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run pages:build
   ```

3. Deploy using Wrangler:
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=my-doh-proxy
   ```

## Configuration

### Environment Variables

| Variable Name | Description | Required |
| ------------- | ----------- | -------- |
| `CUSTOM_DOH_URL` | The upstream DoH URL for the 'Custom' provider (e.g., `https://1.1.1.1/dns-query`) | No (Only for Custom provider) |

## Usage

### Web Interface
Visit your deployed URL (e.g., `https://my-doh-proxy.pages.dev`) to use the visual DNS tester.

### API Endpoints
Configure your DoH client (browser, router, or OS) with the following endpoints:

- **Cloudflare**: `https://<your-domain>/api/doh/cloudflare`
- **Google**: `https://<your-domain>/api/doh/google`
- **AliDNS**: `https://<your-domain>/api/doh/alidns`
- **DNSPod**: `https://<your-domain>/api/doh/dnspod`
- **Custom**: `https://<your-domain>/api/doh/custom` (Requires `CUSTOM_DOH_URL`)
- **Manual**: `https://<your-domain>/api/doh/manual?upstream=<url>`

## Development

```bash
# Start local development server
npm run dev

# Test Custom provider locally
CUSTOM_DOH_URL=https://1.1.1.1/dns-query npm run dev
```

## License

MIT
