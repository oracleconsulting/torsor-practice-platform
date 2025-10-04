
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, ChevronDown, ChevronUp, 
  CheckCircle, Calendar, FileText
} from 'lucide-react';

interface SprintTask {
  id: string;
  task_id: string;
  task_title: string;
  task_description: string;
  completed: boolean;
  completed_date: string | null;
  notes: string | null;
  week: number;
}

interface TaskCardProps {
  task: SprintTask;
  onToggle: (taskId: string, completed: boolean) => void;
  onAddNote: (taskId: string, notes: string) => void;
}

export const TaskCard = ({ task, onToggle, onAddNote }: TaskCardProps) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [noteText, setNoteText] = useState(task.notes || '');

  const handleNoteSave = () => {
    onAddNote(task.task_id, noteText);
    setNotesExpanded(false);
  };

  const getPriorityColor = (title: string) => {
    // Simple priority detection based on keywords
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('urgent') || lowerTitle.includes('critical') || lowerTitle.includes('must')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (lowerTitle.includes('important') || lowerTitle.includes('key') || lowerTitle.includes('essential')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getPriorityText = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('urgent') || lowerTitle.includes('critical') || lowerTitle.includes('must')) {
      return 'High';
    }
    if (lowerTitle.includes('important') || lowerTitle.includes('key') || lowerTitle.includes('essential')) {
      return 'Medium';
    }
    return 'Low';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => onToggle(task.task_id, checked as boolean)}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-semibold ${
                task.completed ? 'text-green-800 line-through' : 'text-oracle-navy'
              }`}>
                {task.task_title}
              </h4>
              <Badge className={`text-xs ${getPriorityColor(task.task_title)}`}>
                {getPriorityText(task.task_title)}
              </Badge>
              {task.completed && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            
            <p className={`text-sm mb-3 ${
              task.completed ? 'text-green-700' : 'text-gray-600'
            }`}>
              {task.task_description}
            </p>

            {task.completed && task.completed_date && (
              <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
                <Calendar className="h-3 w-3" />
                <span>Completed {new Date(task.completed_date).toLocaleDateString()}</span>
              </div>
            )}

            {task.notes && !notesExpanded && (
              <div className="bg-gray-50 rounded p-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <FileText className="h-3 w-3" />
                  <span>Note:</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{task.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotesExpanded(!notesExpanded)}
                className="text-xs text-oracle-navy p-1 h-auto"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {task.notes ? 'Edit Note' : 'Add Note'}
                {notesExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>

            {notesExpanded && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes about this task..."
                  className="text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleNoteSave}
                    className="text-xs"
                  >
                    Save Note
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotesExpanded(false);
                      setNoteText(task.notes || '');
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
