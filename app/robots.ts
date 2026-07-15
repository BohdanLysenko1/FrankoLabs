import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App surfaces — nothing worth indexing, and crawlers churn the demo.
      disallow: ["/crm", "/portal/", "/auth/", "/login"],
    },
    sitemap: "https://frankolabs.com/sitemap.xml",
  };
}
