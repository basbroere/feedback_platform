import type { Persona } from "@/lib/persona/types";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";
import type {
  ManagerUpcomingOneOnOne,
  TeamMember,
} from "@/lib/one-on-ones/queries";
import type {
  OpenFeedbackRequestForPeer,
  FeedbackWithSource,
} from "@/lib/feedback/types";
import type { Dossier } from "@/lib/action-items/queries";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";
import type {
  ManagerConversationEvent,
  ManagerNotification,
} from "@/lib/dashboard/manager-queries";
import { LayoutC } from "./layout-c";
import { ManagerDashboard } from "./manager/manager-dashboard";

export type EmployeeDashboardData = {
  persona: Persona;
  subtitle: string;
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
};

export type ManagerDashboardData = {
  persona: Persona;
  subtitle: string;
  twoWeekEvents: ManagerConversationEvent[];
  monthEvents: ManagerConversationEvent[];
  monthStart: Date;
  notifications: ManagerNotification[];
};

export type DashboardSwitchProps =
  | { variant: "employee"; data: EmployeeDashboardData }
  | { variant: "manager"; data: ManagerDashboardData };

// Backwards-compat: oude callers gebruikten DashboardData met losse velden.
// Behoud die naam voor LayoutC.
export type DashboardData = EmployeeDashboardData;

export function DashboardViewSwitcher(props: DashboardSwitchProps) {
  if (props.variant === "manager") {
    return (
      <ManagerDashboard
        persona={props.data.persona}
        subtitle={props.data.subtitle}
        twoWeekEvents={props.data.twoWeekEvents}
        monthEvents={props.data.monthEvents}
        monthStart={props.data.monthStart}
        notifications={props.data.notifications}
      />
    );
  }
  return <LayoutC data={props.data} />;
}
