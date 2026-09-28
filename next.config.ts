import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'usekvik.com',
    '*.usekvik.com',
    '*.trycloudflare.com',
    'prepared-photographs-felt-boc.trycloudflare.com',
    'localhost:3000',
    'app.localhost:3000',
    '*.ngrok-free.dev',
  ],
};

export default withNextIntl(nextConfig);
