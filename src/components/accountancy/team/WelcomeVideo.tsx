/**
 * WelcomeVideo Component
 * PROMPT 6: Onboarding Checklist System
 * 
 * Embedded introduction video player
 */

import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WelcomeVideoProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  duration?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export const WelcomeVideo: React.FC<WelcomeVideoProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  duration = '5:30',
  onComplete,
  isCompleted = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasWatched, setHasWatched] = useState(isCompleted);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    // Simulate video progress (in real implementation, track actual video progress)
    if (!isPlaying && !hasWatched) {
      // Simulate watching
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            clearInterval(interval);
            setHasWatched(true);
            if (onComplete) onComplete();
            return 100;
          }
          return newProgress;
        });
      }, 100);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Default thumbnail if none provided
  const defaultThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOnJnYig1OSwxMzAsMjQ2KTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOnJnYigxMzksMTI2LDIzMyk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ3JhZCkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldlbGNvbWUgdG8gdGhlIFRlYW0hPC90ZXh0Pjwvc3ZnPg==';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Video Player Container */}
        <div className="relative aspect-video bg-black group">
          {/* Video Thumbnail/Player */}
          <div className="absolute inset-0">
            <img
              src={thumbnailUrl || defaultThumbnail}
              alt={title}
              className={`w-full h-full object-cover transition-opacity ${
                isPlaying ? 'opacity-50' : 'opacity-100'
              }`}
            />
            
            {/* Play Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className="h-20 w-20 rounded-full bg-white/90 hover:bg-white text-primary hover:scale-110 transition-transform"
                >
                  <Play className="h-10 w-10 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(isPlaying || progress > 0) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMuteToggle}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <span className="text-white text-sm ml-2">{duration}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/20"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Completion Badge */}
          {hasWatched && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white border-0 shadow-lg">
                <CheckCircle className="h-4 w-4 mr-1" />
                Watched
              </Badge>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            {hasWatched && (
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Key Takeaways */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Key Takeaways:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Welcome to the team and company culture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Overview of your role and responsibilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Introduction to key team members and stakeholders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Expectations for your first 30, 60, 90 days</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          {!hasWatched && (
            <div className="mt-4">
              <Button onClick={handlePlayPause} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Watching
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

