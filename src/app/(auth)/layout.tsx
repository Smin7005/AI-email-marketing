import { type Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in or sign up to access your account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8`}>
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </ClerkProvider>
  );
}
