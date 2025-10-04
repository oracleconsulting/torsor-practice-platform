
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';

export const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Top Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard>
          <Skeleton className="h-6 w-40 mb-4 bg-white/20" />
          <div className="flex justify-center mb-6">
            <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-white/20" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-16 h-2 bg-white/20" />
                  <Skeleton className="h-4 w-8 bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <Skeleton className="h-6 w-48 mb-4 bg-white/20" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20" />
              <Skeleton className="h-4 w-24 mx-auto bg-white/20" />
            </div>
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20" />
              <Skeleton className="h-4 w-24 mx-auto bg-white/20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-4 bg-white/20" />
          <Skeleton className="h-4 w-3/4 bg-white/20" />
        </GlassCard>
      </div>

      {/* Quick Actions Skeleton */}
      <GlassCard>
        <Skeleton className="h-6 w-32 mb-4 bg-white/20" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
              <Skeleton className="w-8 h-8 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-16 bg-white/20" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Bottom Row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40 bg-white/20" />
            <Skeleton className="h-5 w-16 bg-white/20" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32 bg-white/20" />
                  <Skeleton className="h-5 w-20 bg-white/20" />
                </div>
                <Skeleton className="h-4 w-24 mb-2 bg-white/20" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-16 h-1.5 bg-white/20" />
                    <Skeleton className="h-3 w-8 bg-white/20" />
                  </div>
                  <Skeleton className="h-3 w-16 bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <Skeleton className="h-6 w-32 mb-4 bg-white/20" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1 bg-white/20" />
                    <Skeleton className="h-4 w-16 bg-white/20" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
                  <Skeleton className="h-5 w-16 bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
