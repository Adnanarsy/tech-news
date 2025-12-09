import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Providers from "@/app/providers";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechNews",
  description: "Technology news with privacy-preserving interest scoring",
};

// Nav moved to client component in components/Nav.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Nav />
          {/* Add top padding to account for fixed navbar (h-16) and fixed section header (h-12 approx) */}
          <main className="mx-auto max-w-screen-2xl p-4 pt-32">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
