import { cn } from "@/lib/utils"

interface AdBannerProps {
  slot: "top" | "mid" | "bottom"
  className?: string
}

export function AdBanner({ slot, className }: AdBannerProps) {
  const isRectangle = slot === "mid"

  return (
    <div
      data-ad-slot={slot}
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed border-border bg-muted/40",
        isRectangle
          ? "mx-auto h-[250px] w-full max-w-[300px]"
          : "h-[50px] w-full sm:h-[90px]",
        className
      )}
      aria-label="Publicidade"
    >
      <span className="text-xs text-muted-foreground select-none">Publicidade</span>
    </div>
  )
}
