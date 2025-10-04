
export interface DashboardHeaderProps {
  user: any;
  onSignOut: () => void;
}

export interface WelcomeBannerProps {
  email: string;
  tier: string;
  isAdminView?: boolean;
  clientEmail?: string;
}

export interface BoardDisplayProps {
  groupId: string;
}

export interface ExpandableSectionProps {
  title: string;
  description: string;
  icon: any;
  badge?: {
    text: string;
    className: string;
  };
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export interface ScrollingFeedProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
}
