import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Yoshos Ranking",
    template: "%s · Yoshos Ranking",
  },
  description:
    "Ranking comunitario de Super Smash Bros. con flujo de aprobación mutua.",
  applicationName: "Yoshos Ranking",
  authors: [{ name: "Yoshos Community" }],
  keywords: [
    "Super Smash Bros",
    "ranking",
    "Elo",
    "torneos",
    "comunidad",
    "PWA",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yoshos",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#00011F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
          <InstallPrompt />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
