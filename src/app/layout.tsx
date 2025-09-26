import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper'
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Femite Hemp Fashion - Admin Panel",
  description: "Admin dashboard for managing Femite hemp fashion ecommerce store",
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className={`${inter.className} h-full antialiased`}>
        <AdminLayoutWrapper>
          {children}
        </AdminLayoutWrapper>
      </body>
    </html>
  );
}
