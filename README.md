# Secure DoH Proxy

A privacy-focused, multi-upstream DNS over HTTPS (DoH) proxy built with **Next.js 16**.

## Features

-  **Secure & Up-to-Date**: Built with the latest Next.js 16 (CVE-2025-66478 Patched).
-  **Multi-Upstream**: Support for Cloudflare, Google, AliDNS, DNSPod, and Custom upstream.
-  **DNS Tester**: Built-in beautiful UI to test DNS resolution across different providers.
-  **Privacy First**: No logs, stateless proxying.
-  **Modern UI**: Built with Tailwind CSS and Lucide Icons.

## Deployment

### Option 1: Vercel (Recommended)

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push this code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project into Vercel.
3. Vercel will automatically detect Next.js and configure the build settings.
4. (Optional) Add environment variables like `CUSTOM_DOH_URL` in the Vercel dashboard.

### Option 2: Docker / Self-Hosted

You can deploy this on any server that supports Node.js or Docker.

**Build & Run with Node.js:**

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the production server
npm start
```

### Option 3: Other Platforms

Since this is a standard Next.js 16 application, it can be deployed on various platforms:
- Cloudflare Pages
- AWS Amplify
- Google Cloud Run
- Azure Static Web Apps
- Netlify
- TencentCloud Edgeone Functions
- AlibabaCloud ESA Function

## Configuration

### Environment Variables

| Variable Name | Description | Required |
| ------------- | ----------- | -------- |
| `CUSTOM_DOH_URL` | The upstream DoH URL for the 'Custom' provider (e.g., `https://1.1.1.1/dns-query`) | No (Only for Custom provider) |

## Usage

### Web Interface
Visit your deployed URL (e.g., `https://your-domain.com`) to use the visual DNS tester.

### API Endpoints
Configure your DoH client (browser, router, or OS) with the following endpoints:

- **Cloudflare**: `/api/doh/cloudflare`
- **Google**: `/api/doh/google`
- **AliDNS**: `/api/doh/alidns`
- **DNSPod**: `/api/doh/dnspod`
- **Custom**: `/api/doh/custom` (Requires `CUSTOM_DOH_URL`)
- **Manual**: `/api/doh/manual?upstream=<url>`

## Development

```bash
# Start local development server
npm run dev

# Test Custom provider locally
CUSTOM_DOH_URL=https://1.1.1.1/dns-query npm run dev
```

## License

AGPL-3.0
