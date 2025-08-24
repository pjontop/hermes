import type React from "react"
import type { Metadata } from "next"
import { Source_Code_Pro } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { SignupStepHandler } from "@/components/auth/signupStepHandler"
import LenisProvider from "@/components/scroll/LenisProvider"

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code-pro",
})

export const metadata: Metadata = {
  title: "Hermes - Intelligent Chat Companion",
  description:
    "Your secure, intelligent chat companion with end-to-end encryption.",
  icons: {
    icon: "/hermes.svg",
    shortcut: "/hermes.svg",
    apple: "/hermes.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceCodePro.variable} antialiased`}
    >
      <head>
        <link rel="stylesheet" href="/hermesSans/stylesheet.css" />
        <style>{`
          html {
            font-family: 'Circular Std', sans-serif;
            --font-sans: 'Circular Std';
            --font-mono: ${sourceCodePro.variable};
          }
        `}</style>
      </head>
      <body>
        <LenisProvider>
          <AuthProvider>
            <SignupStepHandler />
            {children}
          </AuthProvider>
        </LenisProvider>
      </body>
    </html>
  )
}