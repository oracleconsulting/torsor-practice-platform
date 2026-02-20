// ============================================================================
// STAFF ROSTER BUILDER — SA Stage 1 "Your Business"
// ============================================================================
// Inline add/edit/remove people with name, role, department, hourly rate,
// hours per week. Salary-to-hourly helper (÷1,820). Max 10 people.
// ============================================================================

import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

const DEPARTMENT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Select department (optional) —' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'admin', label: 'Admin' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'other', label: 'Other' },
];

const HOURS_PER_WEEK_DEFAULT = 37.5;
const SALARY_TO_HOURLY_DIVISOR = 1820; // 52 weeks × 35 hours
const MAX_PEOPLE = 10;

export interface StaffRosterPerson {
  name: string;
  roleTitle: string;
  department: string;
  hourlyRate: number;
  hoursPerWeek: number;
}

interface StaffRosterBuilderProps {
  value: StaffRosterPerson[];
  onChange: (people: StaffRosterPerson[]) => void;
  placeholder?: string;
  required?: boolean;
}

export function StaffRosterBuilder({ value, onChange, placeholder, required }: StaffRosterBuilderProps) {
  const people = value?.length ? [...value] : [];
  const [salaryInputs, setSalaryInputs] = useState<Record<number, string>>({});

  const addPerson = () => {
    if (people.length >= MAX_PEOPLE) return;
    onChange([
      ...people,
      { name: '', roleTitle: '', department: '', hourlyRate: 0, hoursPerWeek: HOURS_PER_WEEK_DEFAULT },
    ]);
  };

  const updatePerson = (index: number, field: keyof StaffRosterPerson, fieldValue: string | number) => {
    const next = people.map((p, i) =>
      i === index ? { ...p, [field]: fieldValue } : p
    );
    onChange(next);
  };

  const removePerson = (index: number) => {
    onChange(people.filter((_, i) => i !== index));
    setSalaryInputs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const setHourlyFromSalary = (index: number, annualSalaryStr: string) => {
    setSalaryInputs((prev) => ({ ...prev, [index]: annualSalaryStr }));
    const num = parseFloat(annualSalaryStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      const hourly = Math.round((num / SALARY_TO_HOURLY_DIVISOR) * 100) / 100;
      updatePerson(index, 'hourlyRate', hourly);
    }
  };

  return (
    <div className="space-y-4">
      {placeholder && (
        <p className="text-gray-600 text-sm mb-3">{placeholder}</p>
      )}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {people.map((person, index) => (
            <div key={index} className="p-4 bg-white hover:bg-gray-50/50">
              <div className="flex flex-wrap gap-3 items-start">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePerson(index, 'name', e.target.value)}
                    placeholder="e.g. Sophie Chen"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role / title</label>
                  <input
                    type="text"
                    value={person.roleTitle}
                    onChange={(e) => updatePerson(index, 'roleTitle', e.target.value)}
                    placeholder="e.g. Founder / MD"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                  <select
                    value={person.department}
                    onChange={(e) => updatePerson(index, 'department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-[100px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    £/hr
                    <span
                      className="text-gray-400 cursor-help"
                      title="If salaried: annual salary ÷ 1,820 ≈ hourly rate (52×35 hrs)"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={person.hourlyRate || ''}
                    onChange={(e) => updatePerson(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={salaryInputs[index] ?? ''}
                      onChange={(e) => setHourlyFromSalary(index, e.target.value)}
                      placeholder="Or annual salary"
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400 shrink-0">→ £/hr</span>
                  </div>
                </div>
                <div className="w-[70px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hrs/wk</label>
                  <input
                    type="number"
                    min={0}
                    max={168}
                    step={0.5}
                    value={person.hoursPerWeek ?? ''}
                    onChange={(e) => updatePerson(index, 'hoursPerWeek', parseFloat(e.target.value) || HOURS_PER_WEEK_DEFAULT)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => removePerson(index)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    aria-label="Remove person"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {people.length < MAX_PEOPLE ? (
            <button
              type="button"
              onClick={addPerson}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add person
            </button>
          ) : (
            <span className="text-sm text-gray-500">Focus on the people who touch your systems (max {MAX_PEOPLE}).</span>
          )}
          {people.length === 0 && (
            <button
              type="button"
              onClick={addPerson}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add person
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Hourly rate tip: if they're salaried, divide annual salary by 1,820 (52 weeks × 35 hours). A £35k salary ≈ £19/hr.
      </p>
    </div>
  );
}
