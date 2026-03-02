import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/components/providers/query-provider';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { Toaster } from 'sonner';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'react-calendar/dist/Calendar.css';
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
      <ReduxProvider>
        <QueryProvider>
          <html lang="en">
            <head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
              <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased">
              {children}
              <Toaster position="top-right" richColors />
            </body>
          </html>
        </QueryProvider>
      </ReduxProvider>
    </ClerkProvider>
  );
}
