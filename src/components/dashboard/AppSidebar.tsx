import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
  Search,
  Settings,
  User2,
  ClipboardList,
  Map,
  TrendingUp,
  BookOpen,
  Users,
  History,
  LogOut
} from "lucide-react"

import React from "react"

export interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarMenuProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarMenuItemProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  size?: "sm" | "lg"
  variant?: "ghost" | "outline" | "link"
}

export interface SidebarMenuSubProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarMenuSubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

export interface SidebarMenuSubItemProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarHeaderProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarContentProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarFooterProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarGroupProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarGroupLabelProps {
  children: React.ReactNode
  className?: string
}

export interface SidebarGroupContentProps {
  children: React.ReactNode
  className?: string
}

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useAssessmentProgress } from "@/hooks/useAssessmentProgress"

interface AppSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { progress } = useAssessmentProgress();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sidebar sign out error:', error);
      window.location.href = '/';
    }
  };

  // Main navigation items - removed roadmap
  const items = [
    {
      title: "Dashboard",
      url: "overview",
      icon: Home,
    },
    {
      title: "Assessment",
      url: "assessment-part1",
      icon: ClipboardList,
      badge: progress.part1Complete ? 
        (progress.part2Complete ? "Complete" : "Part 2 Available") : 
        "Start"
    },
    {
      title: "History",
      url: "history",
      icon: History,
      disabled: !progress.part2Complete
    },
    {
      title: "Business Feed",
      url: "feed",
      icon: TrendingUp,
    },
    {
      title: "Resources",
      url: "resources",
      icon: BookOpen,
    }
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-oracle-navy text-sidebar-primary-foreground">
                  <div className="text-oracle-gold font-bold">O</div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-oracle-navy">Oracle Portal</span>
                  <span className="truncate text-xs text-gray-600">Strategic Insights</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeView === item.url}
                    disabled={item.disabled}
                  >
                    <button
                      onClick={() => !item.disabled && onNavigate(item.url)}
                      className="w-full flex items-center gap-2"
                      disabled={item.disabled}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs bg-oracle-gold/20 text-oracle-navy px-2 py-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User2 />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.email?.split('@')[0] || 'User'}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
