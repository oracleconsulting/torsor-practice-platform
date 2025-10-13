/**
 * User Management Component
 * Nuclear option to manage and delete users
 * Shows duplicates, allows permanent deletion
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import {
  Trash2,
  AlertTriangle,
  Users,
  Search,
  RefreshCw,
  Copy,
  Shield,
  Mail,
} from 'lucide-react';

interface User {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  vark_assessment_completed: boolean;
  last_login?: string;
}

export default function UserManagement() {
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (practice?.id) {
      loadUsers();
    }
  }, [practice?.id]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    if (!practice?.id) return;
    
    setLoading(true);
    try {
      console.log('[UserManagement] Loading users for practice:', practice.id);
      
      const { data, error } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', practice.id)
        .order('name');

      if (error) {
        console.error('[UserManagement] Error loading users:', error);
        throw error;
      }

      console.log('[UserManagement] Loaded', data?.length, 'users');
      setUsers(data || []);
      
      // Check for duplicates
      const duplicates = findDuplicates(data || []);
      if (duplicates.length > 0) {
        toast({
          title: 'Duplicates Detected',
          description: `Found ${duplicates.length} duplicate email(s). Review and delete as needed.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const findDuplicates = (userList: User[]) => {
    const emailMap = new Map<string, User[]>();
    
    userList.forEach(user => {
      const existing = emailMap.get(user.email) || [];
      existing.push(user);
      emailMap.set(user.email, existing);
    });

    return Array.from(emailMap.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([email, users]) => ({ email, users }));
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      console.log('[UserManagement] 🗑️ NUCLEAR DELETE for user:', userToDelete.id);

      // Delete in order to respect foreign key constraints
      
      // 1. Delete skill assessments
      const { error: assessmentsError } = await supabase
        .from('skill_assessments')
        .delete()
        .eq('team_member_id', userToDelete.id);

      if (assessmentsError) {
        console.error('Error deleting skill assessments:', assessmentsError);
      }

      // 2. Delete CPD activities
      const { error: cpdError } = await supabase
        .from('cpd_activities')
        .delete()
        .eq('practice_member_id', userToDelete.id);

      if (cpdError) {
        console.error('Error deleting CPD activities:', cpdError);
      }

      // 3. Delete learning preferences (VARK)
      const { error: varkError } = await supabase
        .from('learning_preferences')
        .delete()
        .eq('practice_member_id', userToDelete.id);

      if (varkError) {
        console.error('Error deleting learning preferences:', varkError);
      }

      // 4. Delete invitations
      const { error: invitationsError } = await supabase
        .from('invitations')
        .delete()
        .eq('email', userToDelete.email);

      if (invitationsError) {
        console.error('Error deleting invitations:', invitationsError);
      }

      // 5. Finally, delete the practice member
      const { error: memberError } = await supabase
        .from('practice_members')
        .delete()
        .eq('id', userToDelete.id);

      if (memberError) {
        console.error('Error deleting practice member:', memberError);
        throw memberError;
      }

      // 6. If they have a user_id, optionally delete from auth.users (admin only)
      // Note: This requires admin privileges and may not be possible from client
      if (userToDelete.user_id) {
        console.log('[UserManagement] User has auth account:', userToDelete.user_id);
        console.log('[UserManagement] Note: Auth account deletion requires admin API');
      }

      console.log('[UserManagement] ✅ User deleted successfully');
      
      toast({
        title: 'User Deleted',
        description: `${userToDelete.name} has been permanently removed`,
      });

      // Reload users list
      await loadUsers();
      setUserToDelete(null);
      
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getDuplicateEmails = () => {
    const emailCount = new Map<string, number>();
    users.forEach(user => {
      emailCount.set(user.email, (emailCount.get(user.email) || 0) + 1);
    });
    return new Set(
      Array.from(emailCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([email]) => email)
    );
  };

  const duplicateEmails = getDuplicateEmails();

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white font-medium">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white font-bold">
                <Users className="w-5 h-5 text-white" />
                User Management
              </CardTitle>
              <CardDescription className="text-gray-200 font-medium">
                Manage practice members • Nuclear delete option
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-gray-200 font-medium">Total Users</div>
              </div>
              {duplicateEmails.size > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-400">{duplicateEmails.size}</div>
                  <div className="text-sm text-gray-200 font-medium">Duplicates</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-600 text-white font-medium placeholder:text-gray-400"
              />
            </div>
            <Button
              variant="outline"
              onClick={loadUsers}
              disabled={loading}
              className="border-gray-600 text-white font-bold hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-bold">
                {searchQuery ? 'No users found' : 'No users yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isDuplicate = duplicateEmails.has(user.email);
                
                return (
                  <div
                    key={user.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isDuplicate
                        ? 'bg-red-900/20 border-red-500/50'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{user.name}</h3>
                          {isDuplicate && (
                            <Badge variant="destructive" className="text-xs font-bold">
                              <Copy className="w-3 h-3 mr-1" />
                              Duplicate
                            </Badge>
                          )}
                          {!user.is_active && (
                            <Badge variant="secondary" className="text-xs font-bold">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-white font-medium">
                            <Mail className="w-4 h-4 text-white" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-white font-medium">
                            <Shield className="w-4 h-4 text-white" />
                            {user.role}
                          </div>
                          {user.user_id && (
                            <div className="text-xs text-gray-300 font-medium">
                              Auth ID: {user.user_id.slice(0, 8)}...
                            </div>
                          )}
                          <div className="text-xs text-gray-300 font-medium">
                            Joined: {new Date(user.joined_at).toLocaleDateString()}
                            {user.vark_assessment_completed && (
                              <span className="ml-2 text-green-400 font-bold">• VARK Complete</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => !deleting && setUserToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white font-bold">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Nuclear Delete: {userToDelete?.name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-200 font-medium">
              This action cannot be undone. This will permanently delete:
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-white font-medium">
                <li>Practice member record</li>
                <li>All skill assessments</li>
                <li>All CPD activities</li>
                <li>VARK learning preferences</li>
                <li>Associated invitations</li>
              </ul>
              {userToDelete?.user_id && (
                <p className="mt-3 text-yellow-400 text-sm font-bold">
                  ⚠️ Note: User has an auth account. They can still log in if invited again.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-gray-700 text-white font-bold hover:bg-gray-600 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

