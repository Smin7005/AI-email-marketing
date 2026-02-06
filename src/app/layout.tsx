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
