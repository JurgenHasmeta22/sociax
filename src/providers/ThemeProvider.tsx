"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface IThemeProviderProps {
	children: React.ReactNode;
}

export function ThemeProvider({ children }: IThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</NextThemesProvider>
	);
}
