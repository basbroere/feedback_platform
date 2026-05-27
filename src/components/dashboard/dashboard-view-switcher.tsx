import type { Persona } from "@/lib/persona/types";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";
import type { ManagerUpcomingOneOnOne, TeamMember } from "@/lib/one-on-ones/queries";
import type { OpenFeedbackRequestForPeer, FeedbackWithSource } from "@/lib/feedback/types";
import type { Dossier } from "@/lib/action-items/queries";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";
import { LayoutC } from "./layout-c";

export type DashboardData = {
  persona: Persona;
  upcoming: OneOnOneListItem | null;
  managerUpcoming: ManagerUpcomingOneOnOne[];
  feedbackRequests: OpenFeedbackRequestForPeer[];
  dossier: Dossier;
  feedback: FeedbackWithSource[];
  feedbackLast4Weeks: number;
  latestOneOnOne: { id: string; completed_at: string } | null;
  teamMembers: TeamMember[];
  ownOpenPerformanceReview: PerformanceReviewListItem | null;
  managerOpenPerformanceReviews: PerformanceReviewListItem[];
  scheduledPerformanceReviews: PerformanceReviewListItem[];
  subtitle: string;
};

export function DashboardViewSwitcher({ data }: { data: DashboardData }) {
  return <LayoutC data={data} />;
}
