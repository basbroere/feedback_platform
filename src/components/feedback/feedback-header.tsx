import { MessageCircle } from "lucide-react";
import { PageTitle } from "@/components/ui/page-title";

export function FeedbackHeader({
  totalReceived,
  crossTeamCount,
}: {
  totalReceived: number;
  crossTeamCount: number;
}) {
  const subtitle =
    totalReceived === 0
      ? "Nog niets ontvangen."
      : crossTeamCount > 0
      ? `${totalReceived} ontvangen · ${crossTeamCount} van buiten je team`
      : `${totalReceived} ontvangen`;

  return (
    <PageTitle
      icon={MessageCircle}
      tone="primary"
      title="Feedback"
      subtitle={subtitle}
    />
  );
}
