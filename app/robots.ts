import type { MetadataRoute } from "next";

// SEO-01: disallow crawling of authenticated app paths; everything else
// (sign-in/sign-up) is left crawlable since there is no public content
// strategy funded this phase (PRD Section 8, Decision 4).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/create", "/account"],
    },
  };
}
