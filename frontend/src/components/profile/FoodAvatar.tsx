export const FOOD_AVATARS = [
  { key: "tomato", label: "Tomate" },
  { key: "lemon", label: "Limão" },
  { key: "egg", label: "Ovo" },
  { key: "carrot", label: "Cenoura" },
  { key: "strawberry", label: "Morango" },
  { key: "bread", label: "Pão" },
  { key: "avocado", label: "Abacate" },
  { key: "mushroom", label: "Cogumelo" },
] as const;

export type FoodAvatarKey = (typeof FOOD_AVATARS)[number]["key"];

interface FoodAvatarProps {
  avatarKey?: string | null;
  className?: string;
  label?: string;
}

function drawing(avatarKey: FoodAvatarKey) {
  switch (avatarKey) {
    case "lemon":
      return (
        <>
          <ellipse cx="50" cy="52" rx="27" ry="20" fill="#F2B33D" transform="rotate(-18 50 52)" />
          <path d="M68 31c8-8 14-5 17-1-7 1-12 5-16 10" fill="none" stroke="#7C9A6E" strokeWidth="6" strokeLinecap="round" />
          <path d="M33 57c9 5 21 6 32 1" fill="none" stroke="#FFF6E9" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        </>
      );
    case "egg":
      return (
        <>
          <path d="M26 52c0-20 12-34 27-34 17 0 26 16 24 35-2 19-14 29-27 29-15 0-24-12-24-30Z" fill="#FFF4D8" />
          <circle cx="52" cy="51" r="14" fill="#F2B33D" />
          <circle cx="47" cy="46" r="4" fill="#FFE9A7" opacity=".8" />
        </>
      );
    case "carrot":
      return (
        <>
          <path d="M43 30c-10 8-13 22-3 44 3 7 8 7 12 0 12-21 14-35 5-44Z" fill="#D96A45" transform="rotate(20 50 52)" />
          <path d="M48 29c-7-10-5-18 0-22 3 7 4 13 4 20M55 30c3-11 9-16 15-16-2 7-6 12-12 17" fill="none" stroke="#7C9A6E" strokeWidth="6" strokeLinecap="round" />
          <path d="M43 48l14 5M42 59l11 4" stroke="#A9442F" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "strawberry":
      return (
        <>
          <path d="M50 78C35 68 23 55 26 42c2-10 11-17 24-14 13-3 22 4 24 14 3 13-9 26-24 36Z" fill="#C2452C" />
          <path d="M35 30c6-8 11-10 15-3 4-7 9-5 15 3" fill="#7C9A6E" />
          <g fill="#F8D5A5">
            <circle cx="38" cy="45" r="2" /><circle cx="52" cy="43" r="2" /><circle cx="63" cy="48" r="2" /><circle cx="44" cy="58" r="2" /><circle cx="57" cy="60" r="2" />
          </g>
        </>
      );
    case "bread":
      return (
        <>
          <path d="M24 51c0-18 13-29 26-29s26 11 26 29v24H24V51Z" fill="#D9A36A" />
          <path d="M36 42c4-7 8-10 11-10M52 42c4-7 8-10 11-10" fill="none" stroke="#FFF1D6" strokeWidth="4" strokeLinecap="round" />
          <path d="M29 61h42" stroke="#B77B48" strokeWidth="4" strokeLinecap="round" opacity=".6" />
        </>
      );
    case "avocado":
      return (
        <>
          <path d="M52 17c8 12 23 31 22 45-1 14-10 23-24 23S27 76 27 62c0-14 15-33 25-45Z" fill="#7C9A6E" />
          <path d="M52 28c7 12 14 24 14 34 0 9-6 15-16 15s-16-6-16-15c0-10 9-24 18-34Z" fill="#DCE4A4" />
          <circle cx="50" cy="61" r="11" fill="#A75B34" />
        </>
      );
    case "mushroom":
      return (
        <>
          <path d="M26 49c0-17 10-28 24-28s24 11 24 28H26Z" fill="#C2452C" />
          <path d="M43 47h15l5 29H38l5-29Z" fill="#F7E6D2" />
          <circle cx="38" cy="37" r="5" fill="#FFF6E9" opacity=".9" /><circle cx="59" cy="35" r="4" fill="#FFF6E9" opacity=".9" />
        </>
      );
    case "tomato":
    default:
      return (
        <>
          <circle cx="50" cy="52" r="28" fill="#C2452C" />
          <path d="M50 28c-7-8-13-7-18-4 6 2 10 6 13 11M50 28c7-8 13-7 18-4-6 2-10 6-13 11M50 28c0-8 3-13 7-16" fill="none" stroke="#7C9A6E" strokeWidth="6" strokeLinecap="round" />
          <path d="M34 57c9 7 23 8 33 1" fill="none" stroke="#E88362" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        </>
      );
  }
}

export function FoodAvatar({ avatarKey, className, label = "Avatar do perfil" }: FoodAvatarProps) {
  const resolved = FOOD_AVATARS.some((avatar) => avatar.key === avatarKey)
    ? (avatarKey as FoodAvatarKey)
    : "tomato";

  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="50" fill="#F5D4BF" />
      {drawing(resolved)}
    </svg>
  );
}
