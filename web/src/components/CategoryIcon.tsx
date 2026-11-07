import { MicIcon, MusicIcon, PartyIcon, SparklesIcon, SunIcon, TrophyIcon, type IconProps } from "./icons";

const ICONS = {
  PARTY: PartyIcon,
  CONCERT: MusicIcon,
  CONFERENCE: MicIcon,
  SPORTS: TrophyIcon,
  RELIGIOUS: SunIcon,
  OTHER: SparklesIcon,
} as const;

/** The line icon for an event type (party popper, music note, mic, trophy, sun, sparkles). */
export default function CategoryIcon({ category, ...props }: IconProps & { category: string }) {
  const Icon = ICONS[category as keyof typeof ICONS] ?? SparklesIcon;
  return <Icon {...props} />;
}
