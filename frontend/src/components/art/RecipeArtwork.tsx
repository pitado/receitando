import type { CSSProperties } from "react";

/** Ilustrações vetoriais autorais do Receitando — sem emoji ou pacote de ícones. */
export type RecipeArtworkKind =
  | "all" | "breakfast" | "lunch" | "dinner" | "snack" | "dessert"
  | "dish" | "pan" | "sparkle" | "heart" | "clock" | "arrow" | "play";

type Props = {
  kind: RecipeArtworkKind;
  size?: number;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
};

export function RecipeArtwork({ kind, size = 24, className, filled = false, style }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height={size}
      width={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle", ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {kind === "all" ? (
        <>
          <rect x="7" y="7" width="21" height="21" rx="6" />
          <rect x="36" y="7" width="21" height="21" rx="6" />
          <rect x="7" y="36" width="21" height="21" rx="6" />
          <rect x="36" y="36" width="21" height="21" rx="6" />
          <circle cx="17.5" cy="17.5" r="3.4" fill="currentColor" stroke="none" opacity=".4" />
          <circle cx="46.5" cy="46.5" r="3.4" fill="currentColor" stroke="none" opacity=".4" />
        </>
      ) : null}
      {kind === "breakfast" ? (
        <>
          <path d="M12 26h32v14c0 11-7 16-16 16s-16-5-16-16V26Z" />
          <path d="M44 29h6c12 0 9 17-6 16M9 57h40" />
          <path d="M21 7c-8 8 8 9 0 17M33 7c-8 8 8 9 0 17" strokeWidth="2.5" />
          <path d="M17 32h21" opacity=".4" />
        </>
      ) : null}
      {kind === "lunch" ? (
        <>
          <path d="M13 30h38v16c0 8-6 12-12 12H25c-7 0-12-4-12-12V30Z" />
          <path d="M8 31h48M18 25h29M27 20c-3-3-3-6 0-9M39 20c-3-3-3-6 0-9" />
          <path d="M12 37H7c-3 0-4 4-1 6h6M52 37h5c3 0 4 4 1 6h-6" />
          <path d="M24 30v4M40 30v4" opacity=".5" />
        </>
      ) : null}
      {kind === "dinner" ? (
        <>
          <path d="M42 8C27 12 19 23 22 37c3 14 15 18 29 15C35 65 14 55 10 39 6 21 20 6 42 8Z" fill="currentColor" fillOpacity=".13" />
          <path d="M46 10v11M40.5 15.5h11M52 29v8M48 33h8" />
          <circle cx="35" cy="11" r="1.5" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {kind === "snack" ? (
        <>
          <circle cx="32" cy="32" r="23" fill="currentColor" fillOpacity=".12" />
          <path d="M43 10c-3 6 0 12 7 13" />
          <circle cx="22" cy="23" r="3" fill="currentColor" stroke="none" />
          <circle cx="39" cy="35" r="4" fill="currentColor" stroke="none" />
          <circle cx="24" cy="43" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="37" cy="18" r="2.4" fill="currentColor" stroke="none" />
          <path d="m15 35 3 2m14-12 2 2m-4 25 2-2" />
        </>
      ) : null}
      {kind === "dessert" ? (
        <>
          <path d="M13 49h39M19 54h27M20 24h24l10 23H10l10-23Z" fill="currentColor" fillOpacity=".12" />
          <path d="M17 34h30M23 24l8-11 12 11" />
          <circle cx="33" cy="10" r="4" fill="currentColor" stroke="none" />
          <path d="M31 11c0-5 2-7 5-8" />
          <path d="m16 41 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 4-2" />
        </>
      ) : null}
      {kind === "dish" ? (
        <>
          <circle cx="32" cy="32" r="19" />
          <circle cx="32" cy="32" r="12" opacity=".5" />
          <path d="M7 14v35M3 14v13m8-13v13M54 14v35M54 14c8 5 8 17 0 20" />
        </>
      ) : null}
      {kind === "pan" ? (
        <>
          <ellipse cx="27" cy="36" rx="22" ry="14" fill="currentColor" fillOpacity=".14" />
          <path d="M49 36h12M12 35c2-8 11-13 21-10M14 43c4 7 14 10 24 6" />
          <path d="M18 35c0-7 7-11 14-8 6 2 9 11 3 16-6 5-17 0-17-8Z" fill="#fbf2e8" />
          <circle cx="28" cy="35" r="6.5" fill="#e7b35d" stroke="#96462b" strokeWidth="2.5" />
          <path d="M12 15c-4-5 3-6 0-11M27 13c-3-4 2-6 0-9" opacity=".6" />
        </>
      ) : null}
      {kind === "sparkle" ? (
        <>
          <path d="M32 6c4 14 10 20 25 26-15 5-21 12-25 26-4-14-10-21-25-26 15-6 21-12 25-26Z" fill="currentColor" fillOpacity=".22" />
          <path d="M8 10l5 5m36 34 5 5M54 10l-5 5M10 54l5-5" strokeWidth="2" />
        </>
      ) : null}
      {kind === "heart" ? (
        <path d="M32 54C22 45 8 35 8 23 8 10 23 7 32 18 41 7 56 10 56 23c0 12-14 22-24 31Z" fill={filled ? "currentColor" : "none"} />
      ) : null}
      {kind === "clock" ? (
        <><circle cx="32" cy="32" r="24" /><path d="M32 15v17l11 7" /><path d="M18 8l-6 6m34-6 6 6" /></>
      ) : null}
      {kind === "arrow" ? (
        <><path d="M14 49 49 14M24 14h25v25" /></>
      ) : null}
      {kind === "play" ? (
        <path d="M20 10 53 32 20 54V10Z" fill="currentColor" fillOpacity=".14" />
      ) : null}
    </svg>
  );
}
