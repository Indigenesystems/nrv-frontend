/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          source: "/guest-check/:path*",
          headers: [
            {
              key: "Permissions-Policy",
              value:
                'camera=(self "https://identity.dojah.io" "https://widget.dojah.io"), microphone=(self "https://identity.dojah.io" "https://widget.dojah.io"), geolocation=(self "https://identity.dojah.io" "https://widget.dojah.io")',
            },
          ],
        },
      ];
    },
    async redirects() {
      return [
        { source: "/legal", destination: "/legal/terms", permanent: true },
        { source: "/privacy", destination: "/legal/privacy", permanent: true },
        {
          source: "/r/:id",
          destination: "/dashboard/tenant/verification?verificationId=:id",
          permanent: false,
        },
        {
          source: "/dashboard/manager/requests/new",
          destination: "/dashboard/manager/requests",
          permanent: false,
        },
      ];
    },
    images: {
        remotePatterns: [
          { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
          { protocol: 'https', hostname: 's3-alpha-sig.figma.com', pathname: '/**' },
          { protocol: 'https', hostname: 'avataaars.io', pathname: '/**' },
        ],
      },
      webpack(config, { isServer }) {
        if (!isServer) {
          // Handle SVG imports as React components using @svgr/webpack
          config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
          });
        }
        return config;
      },
      eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
      },
};

export default nextConfig;
