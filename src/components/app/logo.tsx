import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const mark = size === "sm" ? 28 : 32;
  const wordmark = size === "sm" ? "text-[18px]" : "text-[20px]";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/bamback-logo.png"
        alt=""
        width={mark}
        height={mark}
        priority
        className="shrink-0"
      />
      <span
        className={cn(
          "font-extrabold lowercase tracking-tight text-primary",
          wordmark,
        )}
      >
        bamback
      </span>
    </span>
  );
}
