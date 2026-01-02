/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
    skipTrailingSlashRedirect: true,
    serverExternalPackages: ['@prisma/client', 'prisma'],
    experimental: {
        // Future experimental flags can go here
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '**.picsum.photos',
            },
            {
                protocol: 'https',
                hostname: '**.githubusercontent.com',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'x-middleware-cache',
                        value: 'no-cache',
                    },
                ],
            },
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [];
    },
};

export default nextConfig;
