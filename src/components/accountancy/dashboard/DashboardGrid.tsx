import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccountancyContext } from '../../../contexts/AccountancyContext';
import { widgetRegistry, WidgetConfig, getWidgetById } from '../../../config/widgetRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Grid3X3, 
  Settings, 
  Plus, 
  X, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';

export interface WidgetLayout {
  id: string;
  gridArea: string; // CSS grid area (e.g., "1 / 1 / 3 / 4")
  visible: boolean;
  expanded: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetLayout[];
  columns: number;
  rows: number;
}

interface DashboardGridProps {
  className?: string;
  statusMode?: boolean;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ className = '', statusMode = false }) => {
  const context = useAccountancyContext();
  const { subscriptionTier, widgetLayout, updateWidgetLayout } = context || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    const currentTier = (subscriptionTier as 'free' | 'professional' | 'excellence' | 'enterprise') || 'free';
    const permissions = [currentTier];
    const widgets = widgetRegistry.filter(widget => {
      if (!widget.requiredPermissions) return true;
      return widget.requiredPermissions.some(permission => permissions.includes(permission as 'free' | 'professional' | 'excellence' | 'enterprise'));
    });
    setAvailableWidgets(widgets);
  }, [subscriptionTier]);

  const defaultLayout: DashboardLayout = {
    widgets: [
      { id: 'health-score', gridArea: '1 / 1 / 2 / 2', visible: true, expanded: false, order: 1 },
      { id: 'advisory-progress', gridArea: '1 / 2 / 2 / 3', visible: true, expanded: false, order: 2 },
      { id: 'alternate-auditor', gridArea: '2 / 1 / 3 / 2', visible: true, expanded: false, order: 3 },
      { id: 'mtd-capacity', gridArea: '2 / 2 / 3 / 3', visible: true, expanded: false, order: 4 },
      { id: 'esg-reporting', gridArea: '3 / 1 / 4 / 2', visible: true, expanded: false, order: 5 },
      { id: 'continuity-plan', gridArea: '3 / 2 / 4 / 3', visible: true, expanded: false, order: 6 },
      { id: 'cyber-security', gridArea: '4 / 1 / 5 / 2', visible: true, expanded: false, order: 7 },
      { id: 'team-wellness', gridArea: '4 / 2 / 5 / 3', visible: true, expanded: false, order: 8 },
      { id: 'quick-actions', gridArea: '5 / 1 / 6 / 3', visible: true, expanded: false, order: 9 },
      { id: 'active-rescues', gridArea: '6 / 1 / 7 / 2', visible: true, expanded: false, order: 10 },
      { id: 'team-cpd', gridArea: '6 / 2 / 7 / 3', visible: true, expanded: false, order: 11 },
      { id: 'handover-complaints', gridArea: '7 / 1 / 8 / 3', visible: true, expanded: false, order: 12 }
    ],
    columns: 2,
    rows: 7
  };

  const currentLayout = widgetLayout || defaultLayout;

  const handleToggleWidget = (widgetId: string) => {
    const updatedWidgets = currentLayout.widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    );
    
    updateWidgetLayout?.({
      ...currentLayout,
      widgets: updatedWidgets
    });
  };

  const handleToggleExpanded = (widgetId: string) => {
    const updatedWidgets = currentLayout.widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, expanded: !widget.expanded }
        : widget
    );
    
    updateWidgetLayout?.({
      ...currentLayout,
      widgets: updatedWidgets
    });
  };

  const handleAddWidget = (widgetId: string) => {
    const widget = getWidgetById(widgetId);
    if (!widget) return;

    const newWidget: WidgetLayout = {
      id: widgetId,
      gridArea: `${currentLayout.rows + 1} / 1 / ${currentLayout.rows + 2} / ${currentLayout.columns + 1}`,
      visible: true,
      expanded: false,
      order: currentLayout.widgets.length + 1
    };

    updateWidgetLayout?.({
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget],
      rows: currentLayout.rows + 1
    });
  };

  const getGridTemplateAreas = () => {
    const areas: string[][] = Array(currentLayout.rows).fill(null).map(() => 
      Array(currentLayout.columns).fill('.')
    );

    currentLayout.widgets
      .filter(widget => widget.visible)
      .forEach(widget => {
        const [startRow, startCol, endRow, endCol] = widget.gridArea.split(' / ').map(Number);
        for (let row = startRow - 1; row < endRow - 1; row++) {
          for (let col = startCol - 1; col < endCol - 1; col++) {
            if (areas[row] && areas[row][col]) {
              areas[row][col] = widget.id;
            }
          }
        }
      });

    return areas.map(row => `"${row.join(' ')}"`).join(' ');
  };

  const visibleWidgets = currentLayout.widgets.filter(widget => widget.visible);

  return (
    <div className={`${className} ${statusMode ? 'h-full' : 'space-y-6'} overflow-auto min-h-0`}
      style={statusMode ? { height: 'calc(100vh - 64px - 32px)', minHeight: 0, maxHeight: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' } : {}}>
      {/* Grid Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <Badge variant="secondary" className="text-xs">
            {subscriptionTier} Tier
          </Badge>
          {availableWidgets.some(w => w.isNew) && (
            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              New Features
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Done
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Exit Edit' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div 
        className={`grid gap-2 ${statusMode ? 'h-full flex-1' : ''} overflow-auto min-h-0`}
        style={statusMode ? {
          gridTemplateColumns: `repeat(${currentLayout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${currentLayout.rows}, 1fr)`,
          gridTemplateAreas: getGridTemplateAreas(),
          height: '100%',
          minHeight: 0,
          maxHeight: '100%',
        } : {
          gridTemplateColumns: `repeat(${currentLayout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${currentLayout.rows}, minmax(140px, 1fr))`,
          gridTemplateAreas: getGridTemplateAreas(),
          minHeight: '0',
        }}
      >
        <AnimatePresence>
          {visibleWidgets.map((widgetLayout) => {
            const widgetConfig = getWidgetById(widgetLayout.id);
            if (!widgetConfig) return null;

            const WidgetComponent = widgetConfig.component;
            const isExpanded = widgetLayout.expanded;
            const gridSpan = isExpanded ? '1 / 1 / -1 / -1' : widgetLayout.gridArea;

            return (
              <motion.div
                key={widgetLayout.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative"
                style={{ gridArea: gridSpan }}
              >
                <Card className={`h-full flex flex-col bg-white border border-gray-200 hover:shadow-xl transition-all p-2 md:p-3 ${statusMode ? 'min-h-0' : ''}`} style={statusMode ? { minHeight: 0 } : {}}>
                  <CardHeader className="pb-2 flex-shrink-0" style={statusMode ? { minHeight: 0, paddingBottom: 8 } : {}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-[#1a2b4a] text-base">
                          {widgetConfig.name}
                        </CardTitle>
                        {widgetConfig.isNew && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/30">
                            New
                          </Badge>
                        )}
                        {widgetConfig.beta && (
                          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700 border-orange-500/30">
                            Beta
                          </Badge>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleExpanded(widgetLayout.id)}
                            className="text-white hover:bg-white/10"
                          >
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleWidget(widgetLayout.id)}
                            className="text-white hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-0 overflow-auto">
                    <WidgetComponent />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Widget Library (when editing) */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Add Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWidgets
              .filter(widget => !currentLayout.widgets.find(w => w.id === widget.id)?.visible)
              .map((widget) => (
                <Button
                  key={widget.id}
                  variant="outline"
                  onClick={() => handleAddWidget(widget.id)}
                  className="justify-start h-auto p-4 bg-white/5 hover:bg-white/10 text-white border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{widget.name}</div>
                      <div className="text-xs opacity-75">{widget.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}; 