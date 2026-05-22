import { Clock, MessageCircle, Sparkles } from "lucide-react";
import { PageTitle } from "@/components/ui/page-title";
import { MetricCards, type MetricCard } from "@/components/dashboard/metric-strip";

export function FeedbackHeader({
  totalReceived,
  crossTeamCount,
  latestDate,
}: {
  totalReceived: number;
  crossTeamCount: number;
  latestDate: string | null;
}) {
  const metrics: MetricCard[] = [
    {
      value: totalReceived,
      label: "ontvangen",
      icon: MessageCircle,
      tone: "primary",
    },
    {
      value: crossTeamCount,
      label: "cross-team",
      icon: Sparkles,
      tone: "violet",
    },
    {
      value: recencyShort(latestDate),
      label: "laatste feedback",
      icon: Clock,
      tone: "blue",
    },
  ];

  return (
    <div className="space-y-5">
      <PageTitle icon={MessageCircle} tone="primary" title="Feedback" />
      <MetricCards metrics={metrics} />
    </div>
  );
}

function recencyShort(date: string | null): string {
  if (!date) return "–";
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks}w`;
  return `${Math.round(days / 30)}mnd`;
}
