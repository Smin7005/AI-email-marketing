"use client";

import { Progress } from '@/components/ui/progress';

interface QuotaProgressBarProps {
  used: number;
  limit: number;
  className?: string;
}

/**
 * QuotaProgressBar Component
 * Displays a color-coded progress bar for quota usage
 * - Green: 0-80%
 * - Yellow/Amber: 80-90%
 * - Red: 90%+
 */
export function QuotaProgressBar({ used, limit, className }: QuotaProgressBarProps) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;

  // Determine color based on usage
  const getColorClass = () => {
    if (percentage >= 90) return 'bg-red-500'; // 90%+ - Red
    if (percentage >= 80) return 'bg-yellow-500'; // 80-89% - Yellow
    return 'bg-green-500'; // 0-79% - Green
  };

  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">Usage</span>
        <span className="font-medium">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{percentage.toFixed(1)}% used</span>
        <span>
          {Math.max(0, limit - used).toLocaleString()} remaining
        </span>
      </div>
    </div>
  );
}
