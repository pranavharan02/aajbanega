import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/menu/', '/inventory', '/settings', '/plan', '/onboarding', '/dashboard'] },
    ],
    sitemap: 'https://aajbanega.com/sitemap.xml',
  }
}
