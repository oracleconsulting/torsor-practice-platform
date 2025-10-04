import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { Part3Question, Part3Section as Part3SectionType } from '@/data/part3Questions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Part3SectionProps {
  section: Part3SectionType;
  responses: Record<string, any>;
  onResponseChange: (questionId: string, value: any) => void;
}

export const Part3Section = ({ section, responses, onResponseChange }: Part3SectionProps) => {
  const renderQuestion = (question: Part3Question) => {
    const value = responses[question.fieldName] || '';
    
    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => onResponseChange(question.fieldName, val)}
          >
            <div className="space-y-2">
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isChecked = (value as string[])?.includes(option) || false;
              return (
                <div key={option} className="flex items-start space-x-2">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = (value as string[]) || [];
                      const newValues = checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      onResponseChange(question.fieldName, newValues);
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );
      
      case 'slider':
        const sliderValue = value || question.min || 0;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{question.min || 0}{question.format === 'percentage' ? '%' : ''}</span>
              <span className="text-lg font-semibold text-oracle-purple">
                {sliderValue}{question.format === 'percentage' ? '%' : ''}
              </span>
              <span className="text-sm text-gray-600">{question.max || 100}{question.format === 'percentage' ? '%' : ''}</span>
            </div>
            <Slider
              value={[sliderValue]}
              onValueChange={([val]) => onResponseChange(question.fieldName, val)}
              min={question.min || 0}
              max={question.max || 100}
              step={question.step || 1}
              className="w-full"
            />
          </div>
        );
      
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => onResponseChange(question.fieldName, e.target.value)}
            placeholder={question.placeholder}
            className="w-full"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onResponseChange(question.fieldName, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onResponseChange(question.fieldName, parseInt(e.target.value) || 0)}
            placeholder={question.placeholder}
            min={question.min}
            max={question.max}
            className="w-full"
          />
        );
      
      case 'percentage':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => onResponseChange(question.fieldName, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              placeholder={question.placeholder}
              min={0}
              max={100}
              className="w-24"
            />
            <span className="text-gray-600">%</span>
          </div>
        );
      
      case 'matrix':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b"></th>
                  {question.matrixColumns?.map((col) => (
                    <th key={col} className="text-center p-2 border-b text-sm font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.matrixRows?.map((row) => (
                  <tr key={row.id}>
                    <td className="p-2 border-b font-medium">{row.label}</td>
                    {question.matrixColumns?.map((col) => (
                      <td key={`${row.id}-${col}`} className="text-center p-2 border-b">
                        <RadioGroup
                          value={responses[row.fieldName] || ''}
                          onValueChange={(val) => onResponseChange(row.fieldName, val)}
                        >
                          <RadioGroupItem 
                            value={col} 
                            className="mx-auto"
                            id={`${row.fieldName}-${col}`}
                          />
                        </RadioGroup>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-oracle-purple/5 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-oracle-navy mb-2">{section.title}</h2>
        <p className="text-gray-600 mb-4">{section.description}</p>
        <div className="flex items-center text-oracle-purple font-medium">
          <TrendingUp className="h-5 w-5 mr-2" />
          {section.theme}
        </div>
      </div>
      
      <div className="space-y-6">
        {section.questions.map((question, index) => (
          <Card key={question.id} className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Label className="text-base font-medium text-gray-900">
                    {index + 1}. {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
                
                {question.helperText && (
                  <p className="text-sm text-gray-600 flex items-start">
                    <Info className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                    {question.helperText}
                  </p>
                )}
                
                <div className="mt-4">
                  {renderQuestion(question)}
                </div>
                
                {question.insight && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800 flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                      <span className="font-medium">Insight:</span> {question.insight}
                    </p>
                  </div>
                )}
                
                {question.benchmark && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-start">
                      <TrendingUp className="h-4 w-4 mr-2 mt-0.5" />
                      <span className="font-medium">Benchmark:</span> {question.benchmark}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 