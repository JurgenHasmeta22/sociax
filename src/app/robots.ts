import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_PROJECT_URL ?? "http://localhost:4000";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
