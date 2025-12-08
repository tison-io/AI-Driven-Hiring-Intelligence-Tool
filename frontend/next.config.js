/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    domains: ['res.cloudinary.com'],
  },

  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig