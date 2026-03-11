import "./globals.css";
import React from 'react';
import ClientProviders from "@/components/ClientProviders";
import { MobileMenu } from "@/components/navbar/mobile-menu";
import { Toaster } from "sonner";
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={inter.className}>
        <React.Suspense fallback={null}>
          <ClientProviders>
            <MobileMenu />
            <Toaster position="bottom-right" theme="light" closeButton duration={20000} />
            {children}
          </ClientProviders>
        </React.Suspense>
      </body>
    </html>
  );
}
