'use client';

import { useEffect } from 'react';
import { useNextStep } from 'nextstepjs';

const CHAIN: Record<string, string> = {
  'sidebar-tour': 'go-to-leads',
  'leads-tour': 'go-to-collections',
  'collections-tour': 'go-to-campaigns',
};

export function TourChainer() {
  const { startNextStep } = useNextStep();

  useEffect(() => {
    const handleTourDone = (e: Event) => {
      const tourName = (e as CustomEvent<{ tourName: string }>).detail?.tourName;
      const next = tourName ? CHAIN[tourName] : undefined;
      if (!next) return;
      const hasSeen = localStorage.getItem(`tour-${next}-done`) === 'true';
      if (hasSeen) return;
      setTimeout(() => startNextStep(next), 500);
    };

    window.addEventListener('tour-done', handleTourDone);
    return () => window.removeEventListener('tour-done', handleTourDone);
  }, [startNextStep]);

  return null;
}
