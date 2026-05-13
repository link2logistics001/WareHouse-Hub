/**
 * next.config.js — Next.js Application Configuration
 *
 * Configures the Next.js build and runtime behavior for the Link2Logistics platform.
 *
 * Key settings:
 *  - **Image Optimization**: Allows next/image to fetch and optimize images from
 *    Firebase Storage and Unsplash. Multiple quality levels are defined for
 *    responsive image delivery (60–85).
 *  - **Remote Patterns**: Whitelists external image domains so next/image can
 *    proxy and optimize them (required for security).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /** Quality levels available for responsive image optimization */
    qualities: [60, 70, 75, 80, 85],

    /**
     * Whitelisted remote image sources.
     * next/image will only optimize images from these domains.
     * - firebasestorage.googleapis.com: Warehouse photos uploaded by owners
     * - images.unsplash.com: Placeholder/fallback images used in cards and heroes
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
