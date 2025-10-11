/**
 * Mobile Assessment Page
 * PROMPT 7: Mobile-First Assessment Experience
 * 
 * Optimized for mobile devices with:
 * - Swipeable card interface
 * - PWA offline capability
 * - Gesture controls
 * - Performance optimizations
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, Download, Wifi, WifiOff, Loader2, Home, 
  ChevronLeft, ChevronRight, Save
} from 'lucide-react';

// Mobile components
import { MobileSkillCard } from '@/components/accountancy/team/MobileSkillCard';
import { MobileProgressIndicator } from '@/components/accountancy/team/MobileProgressIndicator';

// PWA utilities
import { 
  registerServiceWorker, 
  showInstallPrompt, 
  checkOnlineStatus,
  listenToOnlineStatus,
  syncPendingData
} from '@/lib/pwa/registerSW';

export default function MobileAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inviteCode = searchParams.get('invite');

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assessments, setAssessments] = useState<Map<string, any>>(new Map());
  
  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedIndex = useRef(0);

  // Initialize PWA
  useEffect(() => {
    registerServiceWorker();
    showInstallPrompt();
    
    listenToOnlineStatus((online) => {
      setIsOnline(online);
      if (online) {
        toast({
          title: 'Connection Restored',
          description: 'Syncing your progress...',
        });
        syncPendingData();
      } else {
        toast({
          title: 'Offline Mode',
          description: 'Your progress will sync when connection is restored.',
        });
      }
    });

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    } else {
      setTimeout(() => setShowInstallBanner(true), 5000);
    }
  }, []);

  // Load data
  useEffect(() => {
    if (inviteCode) {
      loadData();
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'No invitation code provided',
        variant: 'destructive',
      });
    }
  }, [inviteCode]);

  // Auto-save on assessment change
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (assessments.size > lastSavedIndex.current) {
        saveProgress();
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [assessments]);

  const loadData = async () => {
    try {
      console.log('[MobileAssessment] Loading data...');
      
      // Try to load from cache first (PWA)
      const cachedData = await loadFromCache();
      if (cachedData) {
        setSkills(cachedData.skills);
        setInvitation(cachedData.invitation);
        setLoading(false);
      }

      // Then fetch fresh data if online
      if (isOnline) {
        const inviteResponse = await fetch(`/api/invitations/${inviteCode}`);
        if (!inviteResponse.ok) throw new Error('Invitation not found');
        const inviteData = await inviteResponse.json();
        setInvitation(inviteData);

        const skillsResponse = await fetch('/api/skills');
        if (!skillsResponse.ok) throw new Error('Failed to load skills');
        const skillsData = await skillsResponse.json();
        setSkills(skillsData || []);

        // Cache data for offline use
        cacheData({ skills: skillsData, invitation: inviteData });
      }
    } catch (error: any) {
      console.error('[MobileAssessment] Load error:', error);
      if (!isOnline) {
        toast({
          title: 'Offline',
          description: 'Using cached data. Connect to internet to sync.',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load assessment',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromCache = async (): Promise<any> => {
    try {
      const cached = localStorage.getItem(`assessment-${inviteCode}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('[MobileAssessment] Cache load error:', error);
      return null;
    }
  };

  const cacheData = (data: any) => {
    try {
      localStorage.setItem(`assessment-${inviteCode}`, JSON.stringify(data));
      
      // Send to service worker for offline access
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_ASSESSMENT_DATA',
          payload: data
        });
      }
    } catch (error) {
      console.error('[MobileAssessment] Cache save error:', error);
    }
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const assessmentData = Array.from(assessments.entries()).map(([skillId, data]) => ({
        skill_id: skillId,
        ...data
      }));

      if (isOnline) {
        // Save to server
        const response = await fetch(`/api/assessments/${inviteCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessments: assessmentData })
        });

        if (!response.ok) throw new Error('Failed to save');
        lastSavedIndex.current = assessments.size;
      } else {
        // Queue for background sync
        await queueForSync(assessmentData);
        toast({
          title: 'Saved Offline',
          description: 'Will sync when connection is restored',
        });
      }
    } catch (error: any) {
      console.error('[MobileAssessment] Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Your progress is saved locally',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const queueForSync = async (data: any[]) => {
    try {
      // Store in IndexedDB for background sync
      const pending = JSON.parse(localStorage.getItem('pending-assessments') || '[]');
      pending.push({
        id: Date.now(),
        inviteCode,
        data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pending-assessments', JSON.stringify(pending));

      // Register background sync
      await syncPendingData();
    } catch (error) {
      console.error('[MobileAssessment] Queue error:', error);
    }
  };

  const handleRatingChange = (skillId: string, type: 'level' | 'interest', value: number) => {
    setAssessments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(skillId) || {};
      newMap.set(skillId, {
        ...existing,
        [type === 'level' ? 'current_level' : 'interest_level']: value
      });
      return newMap;
    });

    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex < skills.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed all skills
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await saveProgress();
    toast({
      title: 'Assessment Complete!',
      description: 'Thank you for completing your skills assessment.',
    });
    navigate('/assessment-complete');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  const currentSkill = skills[currentIndex];
  const currentAssessment = currentSkill ? assessments.get(currentSkill.id) : {};
  const completedCount = skills.filter(s => {
    const a = assessments.get(s.id);
    return a && a.current_level !== undefined;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Exit
          </Button>
          
          {/* Online Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={saveProgress}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Download className="h-5 w-5" />
            <span className="text-sm font-medium">Install app for offline access</span>
          </div>
          <Button 
            id="pwa-install-button" 
            size="sm" 
            variant="secondary"
            onClick={() => setShowInstallBanner(false)}
          >
            Install
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <MobileProgressIndicator
            current={currentIndex}
            total={skills.length}
            completed={completedCount}
            showPercentage={true}
          />
        </div>

        {/* Skill Card */}
        {currentSkill ? (
          <div className="mb-6">
            <MobileSkillCard
              skillName={currentSkill.name}
              category={currentSkill.category}
              description={currentSkill.description}
              currentLevel={currentAssessment?.current_level || 0}
              interestLevel={currentAssessment?.interest_level || 0}
              completed={currentAssessment?.current_level !== undefined}
              totalSkills={skills.length}
              currentIndex={currentIndex}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onRatingChange={(type, value) => handleRatingChange(currentSkill.id, type, value)}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You've rated all {skills.length} skills. Great job!
            </p>
            <Button onClick={handleComplete} size="lg">
              Submit Assessment
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSwipeLeft}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          <Button
            size="lg"
            onClick={handleSwipeRight}
            disabled={currentIndex >= skills.length}
            className="flex-1"
          >
            {currentIndex === skills.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-1">💡 Tip: Swipe left/right to navigate</p>
          <p>📱 Long press to see skill description</p>
        </div>
      </main>
    </div>
  );
}

