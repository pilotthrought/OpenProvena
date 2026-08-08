// @ts-check
// Configuration Next.js pour OpenProvena
// Support i18n, optimisation d'images, et sécurité

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone pour Docker
  output: 'standalone',

  // Activation du support i18n pour FR/EN
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    localeDetection: false,
  },

  // Configuration du proxy API vers le backend FastAPI
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    return [
      {
        // Proxy vers l'API backend
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  // Configuration des en-têtes de sécurité
  async headers() {
    return [
      {
        // Applique les headers de sécurité à toutes les routes
        source: '/:path*',
        headers: [
          {
            // Protection contre le clickjacking
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Protection contre le sniffing de type MIME
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Protection XSS moderne
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Referrer Policy stricte
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Content Security Policy
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
          },
          {
            // Permissions Policy
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Configuration des images distantes autorisées
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Formats d'images optimisés
    formats: ['image/avif', 'image/webp'],
  },
  // Compression automatique
  compress: true,
  // Optimisation des dépendances
  experimental: {
    optimizePackageImports: ['recharts', 'd3', 'clsx'],
  },
};

module.exports = nextConfig;
