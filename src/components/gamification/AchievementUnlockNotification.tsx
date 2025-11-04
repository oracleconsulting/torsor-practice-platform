import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Star, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUnviewedAchievements, markAchievementsAsViewed } from '@/lib/api/gamification/achievement-engine';
import type { MemberAchievement } from '@/lib/api/gamification/achievement-engine';

interface AchievementUnlockNotificationProps {
  memberId: string;
  autoCheck?: boolean; // Automatically check for new achievements on mount
  checkInterval?: number; // Check interval in ms (default: 30000 = 30s)
}

export default function AchievementUnlockNotification({
  memberId,
  autoCheck = true,
  checkInterval = 30000
}: AchievementUnlockNotificationProps) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<MemberAchievement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoCheck) {
      checkForNewAchievements();
      
      // Set up periodic checking
      const interval = setInterval(checkForNewAchievements, checkInterval);
      return () => clearInterval(interval);
    }
  }, [memberId, autoCheck, checkInterval]);

  const checkForNewAchievements = async () => {
    try {
      const newAchievements = await getUnviewedAchievements(memberId);
      
      if (newAchievements && newAchievements.length > 0) {
        setUnlockedAchievements(newAchievements);
        setCurrentIndex(0);
        setIsOpen(true);
        
        // Trigger confetti
        triggerConfetti();
      }
    } catch (error) {
      console.error('[Achievement Notification] Error checking for new achievements:', error);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleNext = () => {
    if (currentIndex < unlockedAchievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      triggerConfetti();
    } else {
      handleClose();
    }
  };

  const handleClose = async () => {
    // Mark all as viewed
    const achievementIds = unlockedAchievements.map(a => a.id);
    try {
      await markAchievementsAsViewed(achievementIds);
    } catch (error) {
      console.error('[Achievement Notification] Error marking achievements as viewed:', error);
    }
    
    setIsOpen(false);
    setUnlockedAchievements([]);
    setCurrentIndex(0);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-400 to-amber-600';
      case 'silver': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-yellow-300 to-yellow-500';
      case 'platinum': return 'from-indigo-300 to-indigo-500';
      case 'diamond': return 'from-cyan-300 to-cyan-500';
      default: return 'from-gray-300 to-gray-500';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond':
      case 'platinum':
        return <Trophy className="w-16 h-16" />;
      case 'gold':
        return <Star className="w-16 h-16" />;
      case 'silver':
        return <Award className="w-16 h-16" />;
      case 'bronze':
      default:
        return <Award className="w-16 h-16" />;
    }
  };

  if (!isOpen || unlockedAchievements.length === 0) {
    return null;
  }

  const currentAchievement = unlockedAchievements[currentIndex];
  const achievement = currentAchievement.achievement;

  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className={`p-6 rounded-full bg-gradient-to-br ${getTierColor(achievement.tier)} text-white shadow-lg animate-bounce`}>
              {getTierIcon(achievement.tier)}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            🎉 Achievement Unlocked!
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-medium text-gray-900 mt-2">
            {achievement.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Achievement Description */}
          <div className="text-center text-gray-600">
            {achievement.description}
          </div>

          {/* Tier Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-1 capitalize bg-gradient-to-r ${getTierColor(achievement.tier)} text-white border-none`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {achievement.tier} Tier
            </Badge>
          </div>

          {/* Points Awarded */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              +{achievement.points_awarded}
            </div>
            <div className="text-sm text-gray-500">Points Earned</div>
          </div>

          {/* Reward Message */}
          {achievement.reward_message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm text-blue-800">
              {achievement.reward_message}
            </div>
          )}

          {/* Progress Indicator */}
          {unlockedAchievements.length > 1 && (
            <div className="flex justify-center gap-2">
              {unlockedAchievements.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {currentIndex < unlockedAchievements.length - 1 ? (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next ({unlockedAchievements.length - currentIndex - 1} more)
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full">
                Awesome! 🎉
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a hook for manual triggering
export function useAchievementNotification(memberId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [achievement, setAchievement] = useState<MemberAchievement | null>(null);

  const showAchievement = (newAchievement: MemberAchievement) => {
    setAchievement(newAchievement);
    setIsOpen(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return {
    isOpen,
    achievement,
    showAchievement,
    closeNotification: () => setIsOpen(false)
  };
}

