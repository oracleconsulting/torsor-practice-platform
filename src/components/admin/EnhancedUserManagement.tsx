import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  FileText, 
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionsPanel } from './QuickActionsPanel';
import { DataTable } from '../ui/data-table';

interface ClientData {
  id: string;
  email: string;
  status: string;
  part1Complete: boolean;
  part2Complete: boolean;
  roadmapGenerated: boolean;
  lastActive: string;
}

interface EnhancedUserManagementProps {
  users: ClientData[];
  onUserAction: (action: string, userData: ClientData) => void;
}

export const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({
  users,
  onUserAction
}) => {
  const columns = [
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Status',
      accessorKey: 'status',
    },
    {
      header: 'Assessment',
      cell: ({ row }) => (
        <div>
          Part 1: {row.original.part1Complete ? '✅' : '❌'}
          <br />
          Part 2: {row.original.part2Complete ? '✅' : '❌'}
        </div>
      ),
    },
    {
      header: 'Roadmap',
      accessorKey: 'roadmapGenerated',
      cell: ({ row }) => (
        row.original.roadmapGenerated ? '✅' : '❌'
      ),
    },
    {
      header: 'Last Active',
      accessorKey: 'lastActive',
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUserAction('view', row.original)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUserAction('regenerate_roadmap', row.original)}
          >
            Regenerate Roadmap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUserAction('regenerate_board', row.original)}
          >
            Regenerate Board
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">User Management</h2>
      {users.length === 0 ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading users...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
        />
      )}
    </div>
  );
}; 