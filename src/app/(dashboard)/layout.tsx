import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import DashboardHeader from '@/components/dashboard-header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth();

  // Allow access in development mode without authentication
  if (process.env.NODE_ENV === 'production' && !userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <main className="py-8">{children}</main>
    </div>
  );
}