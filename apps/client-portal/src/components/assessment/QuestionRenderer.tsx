// ============================================================================
// QUESTION RENDERER COMPONENT
// ============================================================================
// Renders any question type from Part 1, 2, or 3 assessments
// Handles: text, textarea, radio, checkbox, slider, matrix, conditional, multi-part

import React, { useState } from 'react';

interface QuestionOption {
  value: string;
  label?: string;
}

interface MatrixRow {
  id: string;
  label: string;
  fieldName: string;
}

interface ConditionalQuestion {
  id: string;
  question: string;
  type: string;
  fieldName: string;
  options?: string[];
  showWhen: string;
  min?: number;
  max?: number;
}

interface Part {
  id: string;
  label: string;
  type: string;
}

interface Question {
  id: string | number;
  question?: string;
  title?: string;
  context?: string;
  type: string;
  fieldName?: string;
  required?: boolean;
  options?: string[];
  hasOther?: boolean;
  otherLabel?: string;
  helperText?: string;
  placeholder?: string;
  insight?: string;
  benchmark?: string;
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  matrixRows?: MatrixRow[];
  matrixColumns?: string[];
  matrixItems?: Array<{ label: string; fieldName: string }>;
  conditionalQuestions?: ConditionalQuestion[];
  parts?: Part[];
}

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  showInsights?: boolean;
}

export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  showInsights = true 
}: QuestionRendererProps) {
  const [otherValue, setOtherValue] = useState('');
  
  const fieldName = question.fieldName || String(question.id);
  const questionText = question.question || question.title || '';
  const helperText = question.helperText || question.context || '';

  const handleChange = (newValue: any) => {
    onChange(fieldName, newValue);
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'percentage':
        return (
          <input
            type={question.type === 'percentage' ? 'number' : question.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            min={question.min}
            max={question.max}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                       text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 
                       focus:border-transparent transition-all"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                       text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 
                       focus:border-transparent transition-all resize-none"
          />
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all
                  ${value === option 
                    ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
              >
                <input
                  type="radio"
                  name={fieldName}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                  ${value === option ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`}
                >
                  {value === option && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span>{option}</span>
              </label>
            ))}
            {question.hasOther && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder={question.otherLabel || 'Other...'}
                  value={otherValue}
                  onChange={(e) => {
                    setOtherValue(e.target.value);
                    if (e.target.value) {
                      handleChange(`other:${e.target.value}`);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                             text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all
                  ${selectedValues.includes(option)
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v: string) => v !== option);
                    handleChange(newValue);
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center
                  ${selectedValues.includes(option) 
                    ? 'border-emerald-500 bg-emerald-500' 
                    : 'border-slate-500'}`}
                >
                  {selectedValues.includes(option) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span>{option}</span>
              </label>
            ))}
            {question.hasOther && (
              <input
                type="text"
                placeholder={question.otherLabel || 'Other...'}
                value={otherValue}
                onChange={(e) => {
                  setOtherValue(e.target.value);
                  if (e.target.value) {
                    const newValue = [...selectedValues.filter((v: string) => !v.startsWith('other:')), `other:${e.target.value}`];
                    handleChange(newValue);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                           text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>
        );

      case 'slider':
        const min = question.min ?? 0;
        const max = question.max ?? 10;
        const step = question.step ?? 1;
        const sliderValue = value ?? min;
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-400">
              <span>{min}</span>
              <span className="text-2xl font-bold text-emerald-400">{sliderValue}</span>
              <span>{max}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={sliderValue}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                         [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg"
            />
            {question.format === 'percentage' && (
              <div className="text-center text-slate-400">{sliderValue}%</div>
            )}
          </div>
        );

      case 'matrix':
        const matrixRows = question.matrixRows || question.matrixItems?.map(item => ({
          id: item.fieldName,
          label: item.label,
          fieldName: item.fieldName
        })) || [];
        const matrixColumns = question.matrixColumns || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const matrixValue = value || {};

        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-400 font-medium"></th>
                  {matrixColumns.map((col) => (
                    <th key={col} className="p-2 text-center text-slate-400 font-medium text-sm">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-700">
                    <td className="p-3 text-slate-300">{row.label}</td>
                    {matrixColumns.map((col, colIndex) => (
                      <td key={col} className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            handleChange({
                              ...matrixValue,
                              [row.fieldName]: col
                            });
                          }}
                          className={`w-8 h-8 rounded-full transition-all
                            ${matrixValue[row.fieldName] === col
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                        >
                          {typeof col === 'number' || !isNaN(Number(col)) ? colIndex : ''}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'multi-part':
        const partsValue = value || {};
        // Check if this is a revenue-related question (business_turnover)
        const isRevenueQuestion = question.id === 'business_turnover' || 
          (question.parts?.some(p => p.id === 'current_turnover' || p.id === 'target_turnover'));
        const isPreRevenue = partsValue.pre_revenue === true;
        
        return (
          <div className="space-y-4">
            {isRevenueQuestion && (
              <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all
                bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500">
                <input
                  type="checkbox"
                  checked={isPreRevenue}
                  onChange={(e) => {
                    const newValue = {
                      ...partsValue,
                      pre_revenue: e.target.checked
                    };
                    // Clear revenue fields if pre-revenue is checked
                    if (e.target.checked) {
                      question.parts?.forEach(part => {
                        if (part.id === 'current_turnover' || part.id === 'target_turnover') {
                          delete newValue[part.id];
                        }
                      });
                    }
                    handleChange(newValue);
                  }}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-500 bg-slate-700 focus:ring-emerald-500"
                />
                <span className="text-white font-medium">Pre-revenue (not yet generating revenue)</span>
              </label>
            )}
            
            {isPreRevenue && isRevenueQuestion ? (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Anticipated revenue in the next:
                </label>
                <select
                  value={partsValue.anticipated_revenue_years || ''}
                  onChange={(e) => {
                    handleChange({
                      ...partsValue,
                      anticipated_revenue_years: e.target.value
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                             text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select timeframe...</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                </select>
              </div>
            ) : (
              question.parts?.map((part) => (
                <div key={part.id}>
                  <label className="block text-sm text-slate-400 mb-2">{part.label}</label>
                  <input
                    type={part.type}
                    value={partsValue[part.id] || ''}
                    onChange={(e) => {
                      handleChange({
                        ...partsValue,
                        [part.id]: e.target.value
                      });
                    }}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                               text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))
            )}
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {question.options?.map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all
                    ${value?.main === option
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                >
                  <input
                    type="radio"
                    name={fieldName}
                    value={option}
                    checked={value?.main === option}
                    onChange={(e) => handleChange({ ...value, main: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                    ${value?.main === option ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`}
                  >
                    {value?.main === option && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </label>
              ))}
            </div>
            
            {/* Render conditional questions */}
            {question.conditionalQuestions?.filter(cq => cq.showWhen === value?.main).map((cq) => (
              <div key={cq.id} className="pl-6 border-l-2 border-emerald-500/50">
                <label className="block text-sm text-slate-400 mb-2">{cq.question}</label>
                {cq.type === 'number' ? (
                  <input
                    type="number"
                    value={value?.[cq.fieldName] || ''}
                    onChange={(e) => handleChange({ ...value, [cq.fieldName]: e.target.value })}
                    min={cq.min}
                    max={cq.max}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                ) : cq.type === 'radio' ? (
                  <div className="space-y-2">
                    {cq.options?.map((opt) => (
                      <label key={opt} className="flex items-center text-slate-300">
                        <input
                          type="radio"
                          name={cq.fieldName}
                          value={opt}
                          checked={value?.[cq.fieldName] === opt}
                          onChange={(e) => handleChange({ ...value, [cq.fieldName]: e.target.value })}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white"
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {questionText}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </h3>
        {helperText && (
          <p className="text-slate-400">{helperText}</p>
        )}
      </div>

      {/* Input */}
      {renderInput()}

      {/* Insights & Benchmarks */}
      {showInsights && (question.insight || question.benchmark) && (
        <div className="flex flex-wrap gap-3 mt-4">
          {question.insight && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {question.insight}
            </div>
          )}
          {question.benchmark && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {question.benchmark}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionRenderer;

