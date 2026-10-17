import type { ReactNode, SVGProps } from "react";

function Svg({ children, ...p }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" {...p}>
      {children}
    </svg>
  );
}
type P = SVGProps<SVGSVGElement>;

export const HomeIcon = (p: P) => <Svg {...p}><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></Svg>;
export const NewsIcon = (p: P) => <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h4" /></Svg>;
export const SparkIcon = (p: P) => <Svg {...p}><path d="M10 4c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" /><path d="M18 15v5M15.5 17.5h5" /></Svg>;
export const BookIcon = (p: P) => <Svg {...p}><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2Z" /><path d="M12 6v14" /></Svg>;
export const GearIcon = (p: P) => <Svg {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const StarIcon = (p: P) => <Svg {...p} fill="currentColor" strokeWidth="1"><path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9Z" /></Svg>;
export const BellIcon = (p: P) => <Svg {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" /><path d="M10 21h4" /></Svg>;
export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Svg>;
export const FilterIcon = (p: P) => <Svg {...p}><path d="M4 5h16l-6 7v6l-4 2v-8Z" /></Svg>;
export const KebabIcon = (p: P) => <Svg {...p} fill="currentColor" stroke="none"><circle cx="12" cy="5.5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="18.5" r="1.6" /></Svg>;
export const BookmarkIcon = ({ filled, ...p }: P & { filled?: boolean }) => <Svg {...p} fill={filled ? "currentColor" : "none"}><path d="M7 4h10v16l-5-3.5L7 20Z" /></Svg>;
export const ClockIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 1.5" /></Svg>;
export const ChevronIcon = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const BriefcaseIcon = (p: P) => <Svg {...p}><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16" /></Svg>;
export const UserIcon = (p: P) => <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>;
export const ArrowIcon = ({ down, ...p }: P & { down?: boolean }) => <Svg {...p} width="12" height="12" strokeWidth="2.2" style={down ? { transform: "rotate(180deg)" } : undefined}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const VerifiedIcon = (p: P) => <Svg {...p} fill="currentColor" stroke="none" width="14" height="14"><path d="M12 2.5 14.4 4l2.8-.2 1.2 2.6 2.4 1.4-.4 2.8 1 2.6-1.8 2.2-.1 2.8-2.7.9-1.7 2.2-2.7-1-2.7 1-1.7-2.2-2.7-.9-.1-2.8L2.8 13.2l1-2.6-.4-2.8 2.4-1.4L6.8 3.8 9.6 4Z" /><path d="m8.5 12 2.5 2.5 4.5-5" stroke="var(--color-paper)" strokeWidth="2" fill="none" /></Svg>;
export const TrendIcon = (p: P) => <Svg {...p}><path d="m4 16 5-5 4 3 7-8" /><path d="M15 6h5v5" /></Svg>;
export const CoinIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.4-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></Svg>;
export const BarsIcon = (p: P) => <Svg {...p}><path d="M6 20v-6M12 20V6M18 20v-9" /></Svg>;
export const BotIcon = (p: P) => <Svg {...p}><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 8V5M9.5 13h.01M14.5 13h.01" strokeWidth="2.4" /></Svg>;
export const CompassIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></Svg>;
export const InfoIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" strokeWidth="2.2" /></Svg>;
export const StarOutlineIcon = (p: P) => <Svg {...p}><path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9Z" /></Svg>;

export const CompareIcon = (p: P) => <Svg {...p}><path d="M8 4v16M16 4v16" /><path d="m4.5 8 3.5-4 3.5 4M12.5 16l3.5 4 3.5-4" /></Svg>;
