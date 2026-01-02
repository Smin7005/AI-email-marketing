import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-50">
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-[80]">
        <Sidebar />
      </div>
      <main className="md:ml-64 h-screen overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
