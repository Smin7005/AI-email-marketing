'use client';

import { useEffect } from 'react';
import { useNextStep } from 'nextstepjs';
import { useUser } from '@clerk/nextjs';

const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface TourAutoStartProps {
  tourName: string;
}

export function TourAutoStart({ tourName }: TourAutoStartProps) {
  const { startNextStep } = useNextStep();
  const { user } = useUser();

  useEffect(() => {
    if (!user?.createdAt) return;
    const isNewUser = Date.now() - user.createdAt.getTime() < NEW_USER_WINDOW_MS;
    const hasSeenTour = localStorage.getItem(`tour-${tourName}-done`) === 'true';
    const forceRestart = localStorage.getItem('onboarding-force-restart') === 'true';
    if ((isNewUser || forceRestart) && !hasSeenTour) {
      const timer = setTimeout(() => startNextStep(tourName), 800);
      return () => clearTimeout(timer);
    }
  }, [user, startNextStep, tourName]);

  return null;
}
