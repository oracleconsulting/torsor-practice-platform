
import { Card } from "@/components/ui/card";
import { Users, FileText, Shield } from "lucide-react";

interface AdminStatsProps {
  totalClients: number;
  potentialClients: number;
  part1Clients: number;
  part2Clients: number;
}

export const AdminStatsOverview = ({ 
  totalClients, 
  potentialClients, 
  part1Clients, 
  part2Clients 
}: AdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{totalClients}</p>
          </div>
          <Users className="w-8 h-8 text-purple-500" />
        </div>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Signed Up</p>
            <p className="text-3xl font-bold text-white">{potentialClients}</p>
            <p className="text-xs text-gray-500">No assessment</p>
          </div>
          <Users className="w-8 h-8 text-gray-500" />
        </div>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Part 1 Complete</p>
            <p className="text-3xl font-bold text-white">{part1Clients}</p>
            <p className="text-xs text-gray-500">Started assessment</p>
          </div>
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Part 2 Complete</p>
            <p className="text-3xl font-bold text-white">{part2Clients}</p>
            <p className="text-xs text-gray-500">Full assessment</p>
          </div>
          <Shield className="w-8 h-8 text-green-500" />
        </div>
      </Card>
    </div>
  );
};
