declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const ArrowDownCircle: LucideIcon;
  export const ArrowUpCircle: LucideIcon;
  export const BarChart2: LucideIcon;
  export const Calendar: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Edit2: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Home: LucideIcon;
  export const Image: LucideIcon;
  export const LogOut: LucideIcon;
  export const Plus: LucideIcon;
  export const Search: LucideIcon;
  export const Shield: LucideIcon;
  export const Trash2: LucideIcon;
  export const User: LucideIcon;
  export const Wallet: LucideIcon;
  export const X: LucideIcon;
}