'use client';

import { NextStepProvider, NextStep } from 'nextstepjs';
import { tours } from '@/lib/onboarding/tours';

export function NextStepWrapper({ children }: { children: React.ReactNode }) {
  const handleTourComplete = (tourName: string | null) => {
    if (tourName) {
      localStorage.setItem(`tour-${tourName}-done`, 'true');
      window.dispatchEvent(new CustomEvent('tour-done', { detail: { tourName } }));
    }
  };

  const handleTourSkip = (_step: number, tourName: string | null) => {
    if (tourName) {
      localStorage.setItem(`tour-${tourName}-done`, 'true');
      window.dispatchEvent(new CustomEvent('tour-done', { detail: { tourName } }));
    }
  };

  return (
    <NextStepProvider>
      <NextStep
        steps={tours}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
