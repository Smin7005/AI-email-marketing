import Sidebar from '@/components/dashboard/Sidebar';
import { NextStepWrapper } from '@/components/providers/nextstep-provider';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextStepWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-[80]">
          <Sidebar />
        </div>
        <main className="md:ml-64 min-h-screen p-8">
          {children}
        </main>
      </div>
      <OnboardingChecklist />
    </NextStepWrapper>
  );
}
