
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, AlertTriangle } from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { part2Sections } from '@/data/part2Sections';
import { Part2Section } from '@/components/assessment/Part2Section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

export const AssessmentPart2Review = () => {
  const { progress, savePart2Progress, completePart2 } = useAssessmentProgress();
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponses, setEditedResponses] = useState<Record<string, any>>({});
  const [saveToHistory, setSaveToHistory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize edited responses with current progress
  React.useEffect(() => {
    if (progress.part2Answers) {
      setEditedResponses(progress.part2Answers);
    }
  }, [progress.part2Answers]);

  const handleStartEdit = () => {
    setEditedResponses(progress.part2Answers || {});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedResponses(progress.part2Answers || {});
    setIsEditing(false);
  };

  const handleResponseChange = (fieldName: string, value: any) => {
    setEditedResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      // TODO: Call backend API to update Part 2 responses
      // This will need: PUT /api/client-intake-part2 with group_id and responses
      
      // For now, save locally and regenerate roadmap
      await savePart2Progress(editedResponses);
      
      // If user wants to save current roadmap to history
      if (saveToHistory && progress.roadmap) {
        // TODO: Save current roadmap to history table
        console.log('Saving roadmap to history...');
      }
      
      // Regenerate roadmap with new responses
      await completePart2(editedResponses);
      
      setIsEditing(false);
      setSaveToHistory(false);
    } catch (error) {
      console.error('Error updating Part 2 responses:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleHistoryCheckboxChange = (checked: boolean | "indeterminate") => {
    setSaveToHistory(checked === true);
  };

  if (!progress.part2Complete || !progress.part2Answers) {
    return null;
  }

  const hasChanges = JSON.stringify(editedResponses) !== JSON.stringify(progress.part2Answers);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl text-oracle-navy">
              Deep Dive Assessment Review
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Complete
            </Badge>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Answers
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={!hasChanges || isUpdating}
                      className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Update Assessment Answers
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          Updating your answers will regenerate your roadmap with new insights based on your revised responses.
                        </p>
                        {progress.roadmap && (
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <p className="text-orange-800 font-medium mb-2">
                              ⚠️ Your existing roadmap will be replaced
                            </p>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="save-history"
                                checked={saveToHistory}
                                onCheckedChange={handleHistoryCheckboxChange}
                              />
                              <label htmlFor="save-history" className="text-sm text-orange-700">
                                Save current roadmap to history before updating
                              </label>
                            </div>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSaveChanges}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Update & Regenerate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {part2Sections.map((section, index) => (
            <div key={section.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-oracle-navy mb-4">
                Section {index + 1}: {section.title}
              </h3>
              
              {isEditing ? (
                <Part2Section
                  section={section}
                  responses={editedResponses}
                  onResponseChange={handleResponseChange}
                />
              ) : (
                <div className="space-y-4">
                  {section.questions.map((question) => {
                    const answer = progress.part2Answers[question.id];
                    if (!answer && answer !== 0) return null;
                    
                    return (
                      <div key={question.id} className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-gray-900 mb-2">{question.title}</h4>
                        <div className="text-gray-700">
                          {question.type === 'matrix' ? (
                            <div className="space-y-1">
                              {question.matrixRows?.map((row: any) => {
                                const value = progress.part2Answers[row.id];
                                return (
                                  <div key={row.id} className="flex justify-between">
                                    <span>{row.label}:</span>
                                    <span className="font-medium">{value}/10</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : Array.isArray(answer) ? (
                            <ul className="list-disc list-inside">
                              {answer.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{answer}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
