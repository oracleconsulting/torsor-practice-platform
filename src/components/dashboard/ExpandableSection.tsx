
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';

interface ExpandableSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    className: string;
  };
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  defaultExpanded = false,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="mb-6 bg-gray-900/80 backdrop-blur-sm border-gray-800">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-purple-400" />
            <div>
              <CardTitle className="text-white">{title}</CardTitle>
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <Badge className={badge.className}>
                {badge.text}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
