import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';

interface DevelopmentGoal {
  id: string;
  title: string;
  description: string;
  skill_id: string | null;
  category: string;
  current_level: number;
  target_level: number;
  start_date: string;
  target_date: string;
  completed_date: string | null;
  status: string;
  progress_percentage: number;
  learning_resources: any[];
  milestones: any[];
  notes: string;
}

const DevelopmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<DevelopmentGoal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get practice member
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!member) return;
      setMemberId(member.id);

      // Get development goals
      const { data: goalsData } = await supabase
        .from('development_goals')
        .select('*')
        .eq('practice_member_id', member.id)
        .order('target_date', { ascending: true });

      if (goalsData) {
        setGoals(goalsData);
      }

      // Get skills for dropdown
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('name');

      if (skillsData) {
        setSkills(skillsData);
      }

    } catch (error) {
      console.error('Error loading development goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Partial<DevelopmentGoal>) => {
    if (!memberId) return;

    try {
      const { data, error } = await supabase
        .from('development_goals')
        .insert([{
          practice_member_id: memberId,
          ...goalData,
          created_by: (await supabase.auth.getSession()).data.session?.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setGoals([...goals, data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const updateGoal = async (id: string, updates: Partial<DevelopmentGoal>) => {
    try {
      const { data, error } = await supabase
        .from('development_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(goals.map(g => g.id === id ? data : g));
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('development_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const groupedGoals = {
    active: goals.filter(g => g.status === 'active'),
    planned: goals.filter(g => g.status === 'planned'),
    completed: goals.filter(g => g.status === 'completed'),
    other: goals.filter(g => !['active', 'planned', 'completed'].includes(g.status))
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading development goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Development</h1>
          <p className="text-gray-400">Track your learning goals and progress</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Goals</div>
          <div className="text-3xl font-bold text-white">{goals.length}</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Active</div>
          <div className="text-3xl font-bold text-blue-400">{groupedGoals.active.length}</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Completed</div>
          <div className="text-3xl font-bold text-green-400">{groupedGoals.completed.length}</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Avg Progress</div>
          <div className="text-3xl font-bold text-purple-400">
            {goals.length > 0 
              ? Math.round(goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {groupedGoals.active.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Active Goals ({groupedGoals.active.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedGoals.active.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={setEditingGoal}
                onDelete={deleteGoal}
                onUpdateProgress={(id, progress) => updateGoal(id, { progress_percentage: progress })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Planned Goals */}
      {groupedGoals.planned.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Planned Goals ({groupedGoals.planned.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedGoals.planned.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={setEditingGoal}
                onDelete={deleteGoal}
                onUpdateProgress={(id, progress) => updateGoal(id, { progress_percentage: progress })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {groupedGoals.completed.length > 0 && (
        <details className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <summary className="text-lg font-bold text-white cursor-pointer flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Completed Goals ({groupedGoals.completed.length})
          </summary>
          
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedGoals.completed.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={setEditingGoal}
                onDelete={deleteGoal}
                onUpdateProgress={(id, progress) => updateGoal(id, { progress_percentage: progress })}
              />
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Development Goals Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Set learning goals to track your professional development and skill growth.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGoal) && (
        <GoalModal
          goal={editingGoal}
          skills={skills}
          onSave={(data) => editingGoal ? updateGoal(editingGoal.id, data) : createGoal(data)}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
};

// Goal Card Component
const GoalCard: React.FC<{
  goal: DevelopmentGoal;
  onEdit: (goal: DevelopmentGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
}> = ({ goal, onEdit, onDelete, onUpdateProgress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-400">{goal.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Levels */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Current</div>
          <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded font-bold">
            {goal.current_level}/5
          </div>
        </div>
        
        <TrendingUp className="w-4 h-4 text-gray-600" />
        
        <div>
          <div className="text-xs text-gray-400 mb-1">Target</div>
          <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded font-bold">
            {goal.target_level}/5
          </div>
        </div>

        <div className="ml-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
            {goal.status}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm font-medium text-white">{goal.progress_percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress_percentage)}`}
            style={{ width: `${goal.progress_percentage}%` }}
          />
        </div>
        
        {/* Progress Slider */}
        {goal.status === 'active' && (
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress_percentage}
            onChange={(e) => onUpdateProgress(goal.id, Number(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
        </div>
        
        {daysRemaining > 0 ? (
          <span className="text-blue-400">{daysRemaining} days left</span>
        ) : daysRemaining === 0 ? (
          <span className="text-yellow-400">Due today!</span>
        ) : (
          <span className="text-red-400">{Math.abs(daysRemaining)} days overdue</span>
        )}
      </div>
    </div>
  );
};

// Goal Modal Component
const GoalModal: React.FC<{
  goal: DevelopmentGoal | null;
  skills: any[];
  onSave: (data: Partial<DevelopmentGoal>) => void;
  onClose: () => void;
}> = ({ goal, skills, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    skill_id: goal?.skill_id || '',
    category: goal?.category || '',
    current_level: goal?.current_level || 0,
    target_level: goal?.target_level || 5,
    target_date: goal?.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: goal?.status || 'planned',
    progress_percentage: goal?.progress_percentage || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">Goal Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Master Financial Modelling"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What do you want to achieve?"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
          </div>

          {/* Skill (optional) */}
          <div>
            <label className="block text-white font-medium mb-2">Related Skill (Optional)</label>
            <select
              value={formData.skill_id}
              onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a skill --</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.category})
                </option>
              ))}
            </select>
          </div>

          {/* Levels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Current Level *</label>
              <select
                required
                value={formData.current_level}
                onChange={(e) => setFormData({ ...formData, current_level: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[0, 1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    {level} - {['N/A', 'Awareness', 'Working', 'Proficient', 'Advanced', 'Master'][level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Target Level *</label>
              <select
                required
                value={formData.target_level}
                onChange={(e) => setFormData({ ...formData, target_level: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    {level} - {['', 'Awareness', 'Working', 'Proficient', 'Advanced', 'Master'][level]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Date & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Target Date *</label>
              <input
                type="date"
                required
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevelopmentPage;

