import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{ hostname: "localhost", port: "4000" },
			{ hostname: "picsum.photos" },
			{ hostname: "i.pravatar.cc" },
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
