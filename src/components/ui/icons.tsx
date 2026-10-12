import type { SVGProps } from "react";

// Inline stroke icons (no icon dependency). Decorative by default: pair with a text or aria-label.
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
);
export const LogOutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" /></Icon>
);
export const HomeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 11l8-7 8 7M6 10v10h12V10" /></Icon>
);
export const CameraIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></Icon>
);
export const FileCheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 14l2 2 4-4" /></Icon>
);
export const TableIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 5h16v14H4zM4 10h16M10 5v14" /></Icon>
);
export const QuizIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 17v.01M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M4 4h16v16H4z" /></Icon>
);
export const ChartIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" /></Icon>
);
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></Icon>
);
export const InfoIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 11v5M12 8v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></Icon>
);
export const InboxIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5" /></Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8.5 12.5l2.5 2.5 4.5-5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></Icon>
);
export const AlertCircleIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 8v5M12 16v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></Icon>
);
export const AlertTriangleIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4l9 16H3zM12 10v4M12 17v.01" /></Icon>
);
/** Marks AI-generated content (paired with the "Sugerido por IA" label, never alone). */
export const SparkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></Icon>
);
/** Marks values calculated automatically by the system. */
export const GaugeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4.5 17a8 8 0 1 1 15 0M12 13l3.5-3.5M12 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /></Icon>
);
/** Marks decisions that belong to the teacher. */
export const UserCheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21v-1a6 6 0 0 1 9.5-4.9M15 18l2 2 4-4" /></Icon>
);
export const UploadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></Icon>
);
export const FileIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4" /></Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 19h16" /></Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></Icon>
);
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" /></Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6" /></Icon>
);
export const BookIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h8" /></Icon>
);
export const ListIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Icon>
);
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></Icon>
);
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.7 3.6M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 19 12 19c1.9 0 3.6-.7 5-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></Icon>
);
export const PencilLineIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Icon>
);
