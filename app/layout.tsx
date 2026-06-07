import type { Metadata, Viewport } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { PostHogProvider } from "@/components/PostHog"
import { Analytics } from "@vercel/analytics/next"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "आज क्या बनेगा? — Weekly Meal Planner for Indian Households",
    template: "%s | आज क्या बनेगा?",
  },
  description: "Plan meals for the week. Share with your cook. In their language. AI-powered menus across 12 Indian cuisines with recipes in Hindi & Marathi.",
  keywords: ["weekly meal planner India", "recipe app for cook", "cook recipe sharing app Hindi", "meal planning app", "Indian meal planner", "Hindi recipe app"],
  metadataBase: new URL('https://aajbanega.com'),
  openGraph: {
    title: "आज क्या बनेगा? — Weekly Meal Planner",
    description: "Plan meals for the week. Share with your cook. In their language.",
    url: 'https://aajbanega.com',
    siteName: 'आज क्या बनेगा?',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "आज क्या बनेगा?",
    description: "Plan meals for the week. Share with your cook. In their language.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D2A26" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen font-[var(--font-dm-sans)]" style={{ background: '#F5F0EA' }}>
        {children}
        <Suspense fallback={null}><PostHogProvider /></Suspense>
        <Analytics />
      </body>
    </html>
  )
}
