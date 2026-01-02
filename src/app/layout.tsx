import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/components/providers/query-provider';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Email Marketing SaaS",
  description: "AI-powered email marketing for Australian businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      afterSignInUrl="/overview"
      afterSignUpUrl="/overview"
    >
      <QueryProvider>
        <html lang="en">
          <body className="antialiased">
            {children}
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
