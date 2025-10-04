import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface WidgetContainerProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  isNew?: boolean;
  beta?: boolean;
  className?: string;
  actions?: ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  icon,
  children,
  expanded = false,
  onToggle,
  loading = false,
  error = null,
  onRefresh,
  isNew = false,
  beta = false,
  className = '',
  actions
}) => {
  return (
    <Card className={`h-full bg-white border border-gray-200 hover:shadow-xl transition-all ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            <CardTitle className="text-[#1a2b4a] text-lg">
              {title}
            </CardTitle>
            {isNew && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/30">
                New
              </Badge>
            )}
            {beta && (
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700 border-orange-500/30">
                Beta
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {actions}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="text-white hover:bg-white/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-white/10"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                <p className="text-red-600 text-sm mb-2">Error loading data</p>
                <p className="text-gray-600 text-xs">{error}</p>
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="mt-4 text-[#1a2b4a] border-gray-300 hover:bg-gray-50"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export const WidgetSkeleton: React.FC = () => {
  return (
    <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-6 bg-white/10 rounded w-32 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

export const WidgetError: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => {
  return (
    <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <CardTitle className="text-white text-lg">Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 