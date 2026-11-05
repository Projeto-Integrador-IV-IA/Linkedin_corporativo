import Link from "next/link"
import { cn } from "@/lib/utils"

export function Brand({
  inverse = false,
  href = "/"
}: {
  inverse?: boolean
  href?: string
}) {
  return (
    <Link
      href={href}
      aria-label="Synapse — início"
      className={cn(
        "brand inline-flex shrink-0 items-center gap-2.5",
        inverse && "brand-inverse"
      )}
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M6 22 12 8l8 16 6-14M4 16h24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[23px] font-bold tracking-[-1.1px]">
        synapse<span className="text-[#b9df77]">.</span>
      </span>
    </Link>
  )
}
