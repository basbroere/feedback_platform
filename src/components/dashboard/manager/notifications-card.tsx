import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import type {
  ManagerNotification,
  ManagerNotificationKind,
} from "@/lib/dashboard/manager-queries";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  ManagerNotificationKind,
  { icon: LucideIcon; toneText: string; toneBg: string }
> = {
  stale_one_on_one: {
    icon: Clock3,
    toneText: "text-amber-700 dark:text-amber-300",
    toneBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  no_follow_up: {
    icon: CalendarClock,
    toneText: "text-blue-700 dark:text-blue-300",
    toneBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  stale_performance_cycle: {
    icon: AlertCircle,
    toneText: "text-rose-700 dark:text-rose-300",
    toneBg: "bg-rose-50 dark:bg-rose-950/40",
  },
  open_peer_request: {
    icon: MessageCircle,
    toneText: "text-violet-700 dark:text-violet-300",
    toneBg: "bg-violet-50 dark:bg-violet-950/40",
  },
};

export function NotificationsCard({
  notifications,
}: {
  notifications: ManagerNotification[];
}) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-[14px] font-semibold tracking-tight">
          Signalen
        </h3>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Niks dat opvalt. Alles loopt netjes door.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-baseline justify-between px-5 py-3">
        <h3 className="text-[14px] font-semibold tracking-tight">
          Signalen ({notifications.length})
        </h3>
        <span className="text-[11.5px] text-muted-foreground">
          Zachte herinneringen, geen deadlines
        </span>
      </div>
      <ul className="divide-y divide-border/60 border-t border-border">
        {notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  notification,
}: {
  notification: ManagerNotification;
}) {
  const meta = KIND_META[notification.kind];
  const Icon = meta.icon;
  return (
    <li>
      <Link
        href={notification.href}
        className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-accent/30"
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            meta.toneBg,
            meta.toneText,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium leading-tight">
            {notification.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {notification.detail}
          </p>
        </div>
        {notification.person ? (
          <PersonAvatar
            id={notification.person.id}
            name={notification.person.name}
            avatarUrl={notification.person.avatar_url}
            size="sm"
          />
        ) : null}
      </Link>
    </li>
  );
}
