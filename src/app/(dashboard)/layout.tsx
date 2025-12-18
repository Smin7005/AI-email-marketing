import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
