import type { MetadataRoute } from "next"

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000"

const baseUrl = siteUrl.startsWith("http")
  ? siteUrl.replace(/\/$/, "")
  : `https://${siteUrl}`

const staticRoutes = ["/", "/consortium-financing-comparison", "/acoes"]

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }))
}
