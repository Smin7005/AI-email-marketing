'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NEW_USER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const DISMISSED_KEY = 'onboarding-checklist-dismissed';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  href: string;
  storageKey: string;
}

const STEPS: ChecklistStep[] = [
  {
    id: 'sender',
    title: 'Add Your Sender Email',
    description: 'Set up an email address to send campaigns from.',
    href: '/senders',
    storageKey: 'tour-senders-tour-done',
  },
  {
    id: 'leads',
    title: 'Find Your First Leads',
    description: 'Search 50,000+ Australian businesses to target.',
    href: '/leads',
    storageKey: 'tour-leads-tour-done',
  },
  {
    id: 'collection',
    title: 'Create a Collection',
    description: 'Save selected businesses as a recipient list.',
    href: '/collections',
    storageKey: 'tour-collections-tour-done',
  },
  {
    id: 'campaign',
    title: 'Launch Your First Campaign',
    description: 'Generate AI emails and send your first campaign.',
    href: '/campaigns/create?new=true',
    storageKey: 'tour-create-campaign-tour-done',
  },
];

export function OnboardingChecklist() {
  const router = useRouter();
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.createdAt) return;
    const isNewUser = Date.now() - user.createdAt.getTime() < NEW_USER_WINDOW_MS;
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    if (!isNewUser || isDismissed) return;

    const completed = new Set<string>();
    STEPS.forEach((step) => {
      if (localStorage.getItem(step.storageKey) === 'true') {
        completed.add(step.id);
      }
    });
    setCompletedSteps(completed);

    // Only show if not all steps are done
    if (completed.size < STEPS.length) {
      setIsVisible(true);
    }
  }, [user]);

  if (!isVisible) return null;

  const completedCount = completedSteps.size;
  const totalCount = STEPS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const handleStepClick = (step: ChecklistStep) => {
    router.push(step.href);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-xl border border-gray-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900">
              Getting Started
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
              >
                {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                aria-label="Dismiss checklist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount} of {totalCount} complete</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="px-4 pb-4 pt-0">
            <ul className="space-y-3">
              {STEPS.map((step) => {
                const isDone = completedSteps.has(step.id);
                return (
                  <li key={step.id}>
                    <button
                      onClick={() => handleStepClick(step)}
                      className="w-full flex items-start gap-3 text-left group"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-800 group-hover:text-blue-600'} transition-colors`}>
                          {step.title}
                        </p>
                        {!isDone && (
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
