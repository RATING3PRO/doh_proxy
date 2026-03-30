export interface DoHProvider {
  id: string;
  name: string;
  endpoint: string;
  description: string;
}

export const DOH_PROVIDERS: DoHProvider[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    endpoint: 'https://cloudflare-dns.com/dns-query',
    description: 'Cloudflare Public DNS (1.1.1.1)',
  },
  {
    id: 'google',
    name: 'Google',
    endpoint: 'https://dns.google/resolve',
    description: 'Google Public DNS (8.8.8.8)',
  },
  {
    id: 'adguard',
    name: 'AdGuard',
    endpoint: 'https://dns.adguard-dns.com/resolve',
    description: 'AdGuard Home DNS (94.140.14.14)',
  },
  {
    id: 'dnssb',
    name: 'DNS.SB',
    endpoint: 'https://dns.sb/dns-query',
    description: 'DNS.SB (45.11.45.11)',
  },
  {
    id: 'custom',
    name: 'Custom (Env)',
    endpoint: 'Variable',
    description: 'Via CUSTOM_DOH_URL env',
  },
  {
    id: 'manual',
    name: 'Manual Input',
    endpoint: 'Manual',
    description: 'Enter any DoH URL',
  },
];

export function getProvider(id: string): DoHProvider | undefined {
  return DOH_PROVIDERS.find((p) => p.id === id);
}
