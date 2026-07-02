import type { MetadataRoute } from "next";
import { productModules } from "@/lib/products";
import { guides } from "@/lib/guides";

const BASE_URL = "https://frankolabs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1 },
    { path: "/solutions", priority: 0.9 },
    { path: "/pricing", priority: 0.9 },
    { path: "/products", priority: 0.9 },
    { path: "/projects", priority: 0.7 },
    { path: "/projects/voyagr", priority: 0.6 },
    { path: "/resources", priority: 0.6 },
    { path: "/resources/docs", priority: 0.6 },
    { path: "/resources/guides", priority: 0.6 },
    { path: "/resources/changelog", priority: 0.5 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.8 },
  ].map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));

  const productRoutes: MetadataRoute.Sitemap = productModules.map((m) => ({
    url: `${BASE_URL}/products/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${BASE_URL}/resources/guides/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...guideRoutes];
}
