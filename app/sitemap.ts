import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://aajbanega.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://aajbanega.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://aajbanega.com/browse', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://aajbanega.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://aajbanega.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
