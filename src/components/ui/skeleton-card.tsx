import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonCard: React.FC = () => (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <Skeleton className="h-6 w-3/4 bg-gray-700" />
      <Skeleton className="h-4 w-1/2 bg-gray-700 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full bg-gray-700" />
    </CardContent>
  </Card>
);

export const SkeletonTable: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-12 w-full bg-gray-700" />
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-40 bg-gray-700" />
    <Skeleton className="h-64 w-full bg-gray-700" />
  </div>
);

export default SkeletonCard;

