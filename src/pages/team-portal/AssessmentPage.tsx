import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  Award
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredLevel: number;
}

interface SkillAssessment {
  skillId: string;
  currentLevel: number;
  interestLevel: number;
  yearsExperience: number;
  lastUsed: string;
  notes: string;
}

interface CategoryProgress {
  [category: string]: {
    total: number;
    assessed: number;
  };
}

const AssessmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [assessments, setAssessments] = useState<Record<string, SkillAssessment>>({});
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress>({});
  const [memberId, setMemberId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (Object.keys(assessments).length > 0) {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [assessments]);

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

      // Get all skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (skillsData) {
        setSkills(skillsData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(skillsData.map(s => s.category)));
        setCategories(uniqueCategories);

        // Calculate progress per category
        const progress: CategoryProgress = {};
        uniqueCategories.forEach(cat => {
          progress[cat] = {
            total: skillsData.filter(s => s.category === cat).length,
            assessed: 0
          };
        });
        setCategoryProgress(progress);
      }

      // Load existing assessments
      const { data: existingAssessments } = await supabase
        .from('skill_assessments')
        .select('*')
        .eq('team_member_id', member.id);

      if (existingAssessments) {
        const assessmentMap: Record<string, SkillAssessment> = {};
        existingAssessments.forEach(a => {
          assessmentMap[a.skill_id] = {
            skillId: a.skill_id,
            currentLevel: a.current_level || 0,
            interestLevel: a.interest_level || 3,
            yearsExperience: a.years_experience || 0,
            lastUsed: a.last_used_date || new Date().toISOString().split('T')[0],
            notes: a.notes || ''
          };
        });
        setAssessments(assessmentMap);

        // Update progress
        uniqueCategories.forEach(cat => {
          const categorySkills = skillsData.filter(s => s.category === cat);
          const assessed = categorySkills.filter(s => assessmentMap[s.id]).length;
          if (progress[cat]) {
            progress[cat].assessed = assessed;
          }
        });
        setCategoryProgress(progress);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!memberId) return;
    
    setSaving(true);
    try {
      // Save all assessments
      const updates = Object.values(assessments).map(assessment => ({
        team_member_id: memberId,
        skill_id: assessment.skillId,
        current_level: assessment.currentLevel,
        interest_level: assessment.interestLevel,
        years_experience: assessment.yearsExperience,
        last_used_date: assessment.lastUsed,
        notes: assessment.notes,
        assessment_type: 'self',
        assessment_date: new Date().toISOString()
      }));

      // Upsert assessments
      for (const update of updates) {
        await supabase
          .from('skill_assessments')
          .upsert(update, {
            onConflict: 'team_member_id,skill_id,assessment_date'
          });
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAssessmentChange = (skillId: string, field: keyof SkillAssessment, value: any) => {
    setAssessments(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        skillId,
        [field]: value
      }
    }));

    // Update progress
    const skill = skills.find(s => s.id === skillId);
    if (skill && categoryProgress[skill.category]) {
      const categorySkills = skills.filter(s => s.category === skill.category);
      const newAssessments = { ...assessments, [skillId]: { ...assessments[skillId], [field]: value } };
      const assessed = categorySkills.filter(s => newAssessments[s.id] && newAssessments[s.id].currentLevel > 0).length;
      
      setCategoryProgress(prev => ({
        ...prev,
        [skill.category]: {
          ...prev[skill.category],
          assessed
        }
      }));
    }
  };

  const getCurrentCategorySkills = () => {
    if (categories.length === 0) return [];
    return skills.filter(s => s.category === categories[currentCategory]);
  };

  const goToNextSkill = () => {
    const categorySkills = getCurrentCategorySkills();
    if (currentSkillIndex < categorySkills.length - 1) {
      setCurrentSkillIndex(currentSkillIndex + 1);
    } else if (currentCategory < categories.length - 1) {
      setCurrentCategory(currentCategory + 1);
      setCurrentSkillIndex(0);
    }
  };

  const goToPreviousSkill = () => {
    if (currentSkillIndex > 0) {
      setCurrentSkillIndex(currentSkillIndex - 1);
    } else if (currentCategory > 0) {
      const prevCategorySkills = skills.filter(s => s.category === categories[currentCategory - 1]);
      setCurrentCategory(currentCategory - 1);
      setCurrentSkillIndex(prevCategorySkills.length - 1);
    }
  };

  const handleSubmit = async () => {
    await saveProgress();
    setShowSuccess(true);
    setTimeout(() => {
      window.location.href = '/team-portal/profile';
    }, 2000);
  };

  const getOverallProgress = () => {
    const total = Object.values(categoryProgress).reduce((sum, p) => sum + p.total, 0);
    const assessed = Object.values(categoryProgress).reduce((sum, p) => sum + p.assessed, 0);
    return { total, assessed, percentage: total > 0 ? Math.round((assessed / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Assessment Saved!</h2>
          <p className="text-gray-400">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  const categorySkills = getCurrentCategorySkills();
  const currentSkill = categorySkills[currentSkillIndex];
  const assessment = currentSkill ? assessments[currentSkill.id] || { 
    skillId: currentSkill.id,
    currentLevel: 0,
    interestLevel: 3,
    yearsExperience: 0,
    lastUsed: new Date().toISOString().split('T')[0],
    notes: ''
  } : null;

  const progress = getOverallProgress();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Skills Assessment</h1>
            <p className="text-gray-400 text-sm">
              {categories[currentCategory]} • Skill {currentSkillIndex + 1} of {categorySkills.length}
            </p>
          </div>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm font-medium text-white">
              {progress.assessed} / {progress.total} ({progress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {lastSaved && (
            <p className="text-xs text-gray-500 mt-2">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((cat, idx) => {
            const catProgress = categoryProgress[cat];
            const percentage = catProgress ? Math.round((catProgress.assessed / catProgress.total) * 100) : 0;
            
            return (
              <button
                key={cat}
                onClick={() => {
                  setCurrentCategory(idx);
                  setCurrentSkillIndex(0);
                }}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg transition-all
                  ${idx === currentCategory 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }
                `}
              >
                <div className="text-sm font-medium whitespace-nowrap">{cat}</div>
                <div className="text-xs mt-1">{percentage}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skill Assessment Card */}
      {currentSkill && assessment && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 md:p-8 mb-6">
          {/* Skill Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{currentSkill.name}</h2>
                <p className="text-gray-400">{currentSkill.description}</p>
              </div>
              <Award className="w-8 h-8 text-blue-400 flex-shrink-0 ml-4" />
            </div>
            
            {currentSkill.requiredLevel > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  Required Level: {currentSkill.requiredLevel}/5
                </p>
              </div>
            )}
          </div>

          {/* Current Level */}
          <div className="mb-8">
            <label className="block text-white font-medium mb-4">
              📈 Your Current Skill Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => handleAssessmentChange(currentSkill.id, 'currentLevel', level)}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${assessment.currentLevel === level
                      ? 'border-blue-500 bg-blue-500/20 scale-105'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }
                  `}
                >
                  <div className={`text-2xl font-bold mb-1 ${
                    assessment.currentLevel === level ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {level}
                  </div>
                  <div className="text-xs text-gray-400">
                    {['N/A', 'Aware', 'Working', 'Proficient', 'Advanced', 'Master'][level]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interest Level */}
          <div className="mb-8">
            <label className="block text-white font-medium mb-4">
              ❤️ Your Interest Level
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => handleAssessmentChange(currentSkill.id, 'interestLevel', level)}
                  className="flex-1"
                >
                  <Star 
                    className={`w-10 h-10 mx-auto transition-all ${
                      assessment.interestLevel >= level
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Additional Info (Collapsed on Mobile) */}
          <details className="mb-6">
            <summary className="text-white font-medium cursor-pointer hover:text-blue-400 transition-colors">
              📝 Additional Details (Optional)
            </summary>
            
            <div className="mt-4 space-y-4">
              {/* Last Used */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Last Used
                </label>
                <input
                  type="date"
                  value={assessment.lastUsed}
                  onChange={(e) => handleAssessmentChange(currentSkill.id, 'lastUsed', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes (certifications, projects, etc.)
                </label>
                <textarea
                  value={assessment.notes}
                  onChange={(e) => handleAssessmentChange(currentSkill.id, 'notes', e.target.value)}
                  placeholder="e.g., Completed ACA module, Used in Project X..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
              </div>
            </div>
          </details>

          {/* Skip Option */}
          {assessment.currentLevel === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Not familiar with this skill? That's okay! Select "0 - N/A" to skip.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <button
              onClick={goToPreviousSkill}
              disabled={currentCategory === 0 && currentSkillIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {currentCategory === categories.length - 1 && 
             currentSkillIndex === categorySkills.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                Complete Assessment
              </button>
            ) : (
              <button
                onClick={goToNextSkill}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Quick Jump */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold mb-4">Quick Jump</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((cat, idx) => {
            const catProgress = categoryProgress[cat];
            const catSkills = skills.filter(s => s.category === cat);
            
            return (
              <button
                key={cat}
                onClick={() => {
                  setCurrentCategory(idx);
                  setCurrentSkillIndex(0);
                }}
                className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div>
                  <p className="text-white font-medium">{cat}</p>
                  <p className="text-sm text-gray-400">
                    {catProgress?.assessed || 0} / {catSkills.length} assessed
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;

