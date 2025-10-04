
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw, MessageCircle, Loader2 } from "lucide-react";

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

interface UserCardProps {
  client: ClientData;
  isRegenerating: boolean;
  regenerationStatus?: string;
  onRegenerateRoadmap: (groupId: string, clientEmail: string) => void;
  onViewDashboard: (client: ClientData) => void;
  onMessage: (client: ClientData) => void;
}

export const UserCard = ({ 
  client, 
  isRegenerating, 
  regenerationStatus,
  onRegenerateRoadmap, 
  onViewDashboard, 
  onMessage 
}: UserCardProps) => {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'potential':
        return (
          <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
            Signed Up
          </Badge>
        );
      case 'part1':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            Part 1 Complete
          </Badge>
        );
      case 'part2':
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            Full Assessment
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="text-white font-medium">{client.email}</h3>
          <span className="text-gray-400 text-sm">
            Joined: {new Date(client.created_at).toLocaleDateString()}
          </span>
          {client.last_sign_in_at && (
            <span className="text-gray-500 text-sm">
              Last login: {new Date(client.last_sign_in_at).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          {getCategoryBadge(client.category)}
          
          {client.board_generated && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Board Generated
            </Badge>
          )}
          
          {client.roadmap_generated && (
            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
              Roadmap Generated
            </Badge>
          )}
        </div>

        {/* Show regeneration status */}
        {isRegenerating && regenerationStatus && (
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{regenerationStatus}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onMessage(client)}
          variant="outline"
          size="sm"
          className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Message
        </Button>

        {client.category === 'part2' && client.group_id && (
          <Button
            onClick={() => onRegenerateRoadmap(client.group_id!, client.email)}
            variant="outline"
            size="sm"
            disabled={isRegenerating}
            className="border-orange-600/50 text-orange-400 hover:bg-orange-600/10"
          >
            <RefreshCw 
              className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} 
            />
            {isRegenerating ? 'Regenerating...' : 
             client.roadmap_generated ? 'Regenerate Roadmap' : 'Generate Roadmap'}
          </Button>
        )}
        
        {client.group_id && (
          <Button
            onClick={() => onViewDashboard(client)}
            variant="outline"
            size="sm"
            className="border-purple-600/50 text-purple-400 hover:bg-purple-600/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Dashboard
          </Button>
        )}

        {client.category === 'potential' && (
          <span className="text-xs text-gray-500 px-2">
            No assessment data
          </span>
        )}
      </div>
    </div>
  );
};
