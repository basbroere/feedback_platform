import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarBgClass, getInitials } from "@/lib/persona/initials";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  id,
  name,
  avatarUrl,
  size = "default",
  className,
}: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={cn(avatarBgClass(id))}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
