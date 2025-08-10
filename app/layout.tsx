import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CatalystBranding } from "@/components/catalyst-branding";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catalyst Studio",
  description: "AI-Powered Website Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CatalystBranding />
          {children}
        </Providers>
      </body>
    </html>
  );
}
