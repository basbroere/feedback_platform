import { cn } from "@/lib/utils";

// Bambelo-B als rating-pip. Gevuld of leeg afhankelijk van active.
export function BIcon({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(
        "h-5 w-5",
        active
          ? "fill-orange-500 text-orange-500"
          : "fill-transparent text-muted-foreground/40",
        className,
      )}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity={active ? 1 : 0}
      />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        fill={active ? "white" : "currentColor"}
        fillOpacity={active ? 1 : 0.7}
      >
        B
      </text>
    </svg>
  );
}
