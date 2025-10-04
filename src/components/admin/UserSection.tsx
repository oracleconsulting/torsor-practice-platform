
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { UserCard } from "./UserCard";

interface ClientData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  category: 'potential' | 'part1' | 'part2';
  group_id?: string;
  part1_completed_at?: string;
  part2_completed_at?: string;
  roadmap_generated?: boolean;
  board_generated?: boolean;
}

interface UserSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  clients: ClientData[];
  sectionKey: string;
  isCollapsed: boolean;
  regeneratingRoadmaps: Set<string>;
  regenerationStatus?: Record<string, string>;
  onToggleSection: (section: string) => void;
  onRegenerateRoadmap: (groupId: string, clientEmail: string) => void;
  onViewDashboard: (client: ClientData) => void;
  onMessage: (client: ClientData) => void;
}

export const UserSection = ({
  title,
  description,
  icon: Icon,
  iconColor,
  clients,
  sectionKey,
  isCollapsed,
  regeneratingRoadmaps,
  regenerationStatus = {},
  onToggleSection,
  onRegenerateRoadmap,
  onViewDashboard,
  onMessage
}: UserSectionProps) => {
  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
      <div className="p-6">
        <button
          onClick={() => onToggleSection(sectionKey)}
          className="flex items-center justify-between w-full mb-4 text-left"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title} ({clients.length})
            <span className="text-sm text-gray-400 font-normal">{description}</span>
          </h2>
          {isCollapsed ? 
            <ChevronRight className="w-5 h-5 text-gray-400" /> : 
            <ChevronDown className="w-5 h-5 text-gray-400" />
          }
        </button>
        
        {!isCollapsed && (
          <div className="space-y-4">
            {clients.map(client => (
              <UserCard
                key={client.id}
                client={client}
                isRegenerating={regeneratingRoadmaps.has(client.group_id || '')}
                regenerationStatus={regenerationStatus[client.group_id || '']}
                onRegenerateRoadmap={onRegenerateRoadmap}
                onViewDashboard={onViewDashboard}
                onMessage={onMessage}
              />
            ))}
            {clients.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400">No users in this category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
