// export const revalidate = 0; // disables static generation for all nested pages
import { ClerkProvider } from "@/components/clerk-provider";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { esMX } from "@clerk/localizations";
import { NewBadgeWatcher } from "@/components/badges/NewBadgeWatcher";
import { LevelUpWatcher } from "@/components/gamification/LevelUpWatcher";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GymCloud",
  description: "Administra tu gimnasio con GymCloud",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esMX}>
      <html lang="es" className="h-full" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased bg-sidebar`}
        >
          <ThemeProvider attribute="class" defaultTheme="dark">
            <QueryProvider>
              <NewBadgeWatcher />
              <LevelUpWatcher />
              {children}
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
