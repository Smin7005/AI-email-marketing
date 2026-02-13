import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CampaignProgressBarProps {
  title: string;
  current: number;
  total: number;
  label: string;
  colorClass: string;
}

export default function CampaignProgressBar({
  title,
  current,
  total,
  label,
  colorClass,
}: CampaignProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {current}/{total}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`${colorClass} h-2 rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {percentage}% {label}
        </p>
      </CardContent>
    </Card>
  );
}
