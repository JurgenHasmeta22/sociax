import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ToastProvider from "@/providers/ToastProvider";
import { Navbar } from "@/components/root/Navbar";
import "../globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "Sociax",
		template: "%s | Sociax",
	},
	description: "A social media platform",
	robots: {
		follow: true,
		index: true,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html suppressHydrationWarning lang="en">
			<body className={inter.className}>
				<AuthProvider>
					<ThemeProvider>
						<ToastProvider />
						<Navbar />
						<main className="container mx-auto px-4 py-6">
							{children}
						</main>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
