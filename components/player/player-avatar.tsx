import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  nickname: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-16",
} as const;

const textSizes = {
  xs: "text-[0.6rem]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
} as const;

export function PlayerAvatar({ src, nickname, size = "md", className }: Props) {
  const initial = nickname.slice(0, 1).toUpperCase();
  const dim = sizes[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={nickname}
        width={64}
        height={64}
        className={cn(
          dim,
          "rounded-full object-cover ring-1 ring-border",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono font-bold text-primary ring-1 ring-border",
        textSizes[size],
        className,
      )}
      aria-label={nickname}
    >
      {initial}
    </div>
  );
}
