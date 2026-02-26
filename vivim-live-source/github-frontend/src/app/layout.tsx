import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VIVIM - Your Personal AI Memory Platform",
  description: "Own Your AI, Share Your AI, Evolve Your AI. A full-stack application with React PWA frontend, Express.js API server, and P2P networking capabilities.",
  keywords: ["VIVIM", "AI", "Memory", "P2P", "Open Source", "React", "TypeScript"],
  authors: [{ name: "VIVIM Team" }],
  openGraph: {
    title: "VIVIM - Your Personal AI Memory Platform",
    description: "Own Your AI, Share Your AI, Evolve Your AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
