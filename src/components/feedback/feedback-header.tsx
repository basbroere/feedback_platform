import { MessageCircle } from "lucide-react";
import { PageTitle } from "@/components/ui/page-title";

export function FeedbackHeader({
  action,
}: {
  action?: React.ReactNode;
}) {
  return (
    <PageTitle icon={MessageCircle} tone="primary" title="Feedback" action={action} />
  );
}
