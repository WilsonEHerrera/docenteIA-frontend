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
