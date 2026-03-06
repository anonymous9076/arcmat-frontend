/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    async rewrites() {
        return [
            {
                source: '/api/proxy/:path*',
                destination: 'https://arcmat-api.vercel.app/api/:path*',
                // destination: 'http://localhost:8000/api/:path*'
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/api/public/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'arcmat-api.vercel.app',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },

};

export default nextConfig;
