export interface ValidationResult {
  isValid: boolean;
  missing?: string[];
  errors?: string[];
}

// Critical fields from backend validation
const PART1_REQUIRED_FIELDS = [
  'business_name',
  'revenue',
  'location', 
  'industry',
  'time_commitment'
];

export const validatePart1 = (responses: Record<string, any>): ValidationResult => {
  const missing = PART1_REQUIRED_FIELDS.filter(field => {
    const value = responses[field];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

export const validatePart2Completion = (responses: Record<string, any>): boolean => {
  const filledFields = Object.entries(responses).filter(([key, value]) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
  
  // Must have 55 fields OR 90% completion
  const totalPart2Fields = 70; // Approximate total fields
  return filledFields >= 55 || (filledFields / totalPart2Fields) >= 0.9;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Remove the generateGroupId function - we're using UID as primary identifier now
// export const generateGroupId = (): string => {
//   return crypto.randomUUID();
// }; 