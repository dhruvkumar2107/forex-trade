import { MetadataRoute } from 'next';

const BASE_URL = 'https://profitwalla.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/about',
    '/book-now',
    '/brokers',
    '/contact',
    '/features',
    '/how-it-works',
    '/pricing',
    '/risk-disclosure',
    '/security',
    '/login',
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));
}
