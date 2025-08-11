import type { Metadata } from "next";
import { Inter, Kalam, Caveat } from "next/font/google";
import "./globals.css";

// Primary readable font for UI text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Hand-drawn style font for headings and labels
const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-kalam",
  weight: ["400", "700"],
  display: "swap",
});

// Casual handwriting font for annotations and character dialogue
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simili - Math Learning Platform",
  description: "Visual reasoning platform for elementary mathematics education",
  keywords: ["math", "education", "elementary", "learning", "reasoning"],
  authors: [{ name: "Simili Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${kalam.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
