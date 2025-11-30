/**
 * Data Protection & GDPR Compliance Utilities
 * ============================================
 * 
 * These utilities ensure client data is handled safely when:
 * 1. Sending to LLM providers (OpenRouter/Anthropic)
 * 2. Storing in logs
 * 3. Displaying in admin interfaces
 * 
 * KEY PRINCIPLES:
 * - Minimize PII sent to LLMs
 * - Never log sensitive financial details
 * - Anonymize where possible without losing context
 * - Always use "no training" flags with LLM providers
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SanitizationOptions {
  preserveBusinessName?: boolean;  // Sometimes needed for context
  preserveIndustry?: boolean;      // Usually safe to keep
  preserveRevenue?: boolean;       // Can anonymize to ranges
  anonymizeNames?: boolean;        // Replace with Client A, etc.
  redactEmail?: boolean;           // Always redact
  redactPhone?: boolean;           // Always redact
}

export interface PIIField {
  fieldName: string;
  type: 'email' | 'phone' | 'name' | 'address' | 'financial' | 'identifier';
  action: 'redact' | 'anonymize' | 'range' | 'preserve';
}

// ============================================================================
// PII FIELD DEFINITIONS
// ============================================================================

const PII_FIELDS: PIIField[] = [
  // Always redact
  { fieldName: 'email', type: 'email', action: 'redact' },
  { fieldName: 'phone', type: 'phone', action: 'redact' },
  { fieldName: 'user_id', type: 'identifier', action: 'redact' },
  { fieldName: 'client_id', type: 'identifier', action: 'redact' },
  { fieldName: 'group_id', type: 'identifier', action: 'redact' },
  { fieldName: 'practice_id', type: 'identifier', action: 'redact' },
  
  // Anonymize names
  { fieldName: 'full_name', type: 'name', action: 'anonymize' },
  { fieldName: 'userName', type: 'name', action: 'anonymize' },
  
  // Preserve but can anonymize if needed
  { fieldName: 'company_name', type: 'name', action: 'preserve' },
  { fieldName: 'companyName', type: 'name', action: 'preserve' },
  
  // Convert to ranges
  { fieldName: 'annual_turnover', type: 'financial', action: 'range' },
  { fieldName: 'current_income', type: 'financial', action: 'range' },
  { fieldName: 'desired_income', type: 'financial', action: 'range' },
];

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize data before sending to LLM
 * Removes/anonymizes PII while preserving context
 */
export function sanitizeForLLM(
  data: Record<string, any>,
  options: SanitizationOptions = {}
): Record<string, any> {
  const sanitized = { ...data };
  
  const {
    preserveBusinessName = true,
    preserveIndustry = true,
    preserveRevenue = false,
    anonymizeNames = true,
    redactEmail = true,
    redactPhone = true
  } = options;

  // Always redact emails
  if (redactEmail) {
    delete sanitized.email;
    delete sanitized.client_email;
    delete sanitized.user_email;
  }

  // Always redact phone numbers
  if (redactPhone) {
    delete sanitized.phone;
    delete sanitized.mobile;
    delete sanitized.telephone;
  }

  // Always redact identifiers
  delete sanitized.user_id;
  delete sanitized.client_id;
  delete sanitized.group_id;
  delete sanitized.practice_id;
  delete sanitized.id;

  // Anonymize names if requested
  if (anonymizeNames) {
    if (sanitized.full_name) {
      sanitized.full_name = 'the founder';
    }
    if (sanitized.userName) {
      sanitized.userName = 'the founder';
    }
  }

  // Handle business name
  if (!preserveBusinessName) {
    if (sanitized.company_name) {
      sanitized.company_name = 'the business';
    }
    if (sanitized.companyName) {
      sanitized.companyName = 'the business';
    }
  }

  // Convert revenue to ranges if not preserving exact amounts
  if (!preserveRevenue) {
    sanitized.annual_turnover = anonymizeRevenue(sanitized.annual_turnover);
    sanitized.revenueNumeric = anonymizeRevenueNumeric(sanitized.revenueNumeric);
  }

  return sanitized;
}

/**
 * Convert exact revenue to range
 */
function anonymizeRevenue(revenue: string | undefined): string | undefined {
  if (!revenue) return revenue;
  
  const lower = revenue.toLowerCase();
  
  if (lower.includes('pre-revenue') || lower.includes('0')) {
    return 'Pre-revenue';
  }
  if (lower.includes('under') || parseInt(revenue.replace(/\D/g, '')) < 50000) {
    return 'Under £50k';
  }
  if (parseInt(revenue.replace(/\D/g, '')) < 150000) {
    return '£50k-£150k';
  }
  if (parseInt(revenue.replace(/\D/g, '')) < 500000) {
    return '£150k-£500k';
  }
  if (parseInt(revenue.replace(/\D/g, '')) < 1000000) {
    return '£500k-£1m';
  }
  return '£1m+';
}

function anonymizeRevenueNumeric(revenue: number | undefined): string | undefined {
  if (!revenue) return undefined;
  
  if (revenue === 0) return 'Pre-revenue';
  if (revenue < 50000) return 'Under £50k';
  if (revenue < 150000) return '£50k-£150k';
  if (revenue < 500000) return '£150k-£500k';
  if (revenue < 1000000) return '£500k-£1m';
  return '£1m+';
}

/**
 * Redact PII from a string (for logs)
 */
export function redactPII(text: string): string {
  let redacted = text;
  
  // Email pattern
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL REDACTED]'
  );
  
  // UK phone patterns
  redacted = redacted.replace(
    /(\+44|0)\s*\d{2,4}\s*\d{3,4}\s*\d{3,4}/g,
    '[PHONE REDACTED]'
  );
  
  // UUID patterns
  redacted = redacted.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[ID REDACTED]'
  );

  return redacted;
}

/**
 * Create safe log entry (no PII)
 */
export function createSafeLogEntry(event: string, data: Record<string, any>): Record<string, any> {
  return {
    event,
    timestamp: new Date().toISOString(),
    data: {
      industry: data.industry,
      revenueStage: anonymizeRevenueNumeric(data.revenueNumeric),
      hasTeam: data.teamSize !== 'Just me' && data.teamSize !== 'solo',
      // Exclude any PII
    }
  };
}

// ============================================================================
// LLM PROVIDER CONFIGURATION
// ============================================================================

/**
 * OpenRouter headers for no-training requests
 */
export const OPENROUTER_NO_TRAIN_HEADERS = {
  'HTTP-Referer': 'https://torsor.co.uk',
  'X-Title': 'Torsor 365 Platform'
  // Note: OpenRouter/Anthropic API data is NOT used for training by default
  // But we include these headers for documentation and future-proofing
};

/**
 * Build safe LLM request (includes no-training signals)
 */
export function buildSafeLLMRequest(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Record<string, any> {
  return {
    model: options.model || 'anthropic/claude-3.5-sonnet',
    max_tokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are an advisor. All information is confidential and must not be used for training.'
      },
      { role: 'user', content: prompt }
    ],
    // Some providers support these flags
    metadata: {
      no_training: true,
      confidential: true
    }
  };
}

// ============================================================================
// CONSENT & COMPLIANCE HELPERS
// ============================================================================

/**
 * Check if client has consented to AI processing
 */
export function hasAIProcessingConsent(client: { ai_consent?: boolean; consented_at?: string }): boolean {
  return client.ai_consent === true && !!client.consented_at;
}

/**
 * Generate consent record for audit
 */
export function createConsentRecord(
  clientId: string,
  practiceId: string,
  consentType: 'ai_processing' | 'data_storage' | 'communication'
): Record<string, any> {
  return {
    client_id: clientId,
    practice_id: practiceId,
    consent_type: consentType,
    consented_at: new Date().toISOString(),
    consent_version: '1.0',
    ip_address: '[COLLECTED_ON_CLIENT]',
    lawful_basis: 'legitimate_interest_with_consent'
  };
}

// ============================================================================
// DATA RETENTION
// ============================================================================

/**
 * Data retention periods (UK GDPR compliant)
 */
export const DATA_RETENTION = {
  // Active client data
  client_assessments: '7 years',  // For business records
  client_roadmaps: '7 years',     // For business records
  client_tasks: '3 years',        // Operational data
  
  // Logs and audit
  llm_usage_logs: '1 year',       // Anonymized logs only
  ai_corrections: '3 years',      // For training purposes
  
  // Context and comms
  client_context: '3 years',      // Meeting notes etc
  chat_messages: '1 year',        // Support interactions
  
  // After contract end
  post_contract_retention: '6 years'  // UK legal requirement
};

/**
 * Check if data should be deleted (for scheduled cleanup)
 */
export function shouldDeleteData(
  dataType: keyof typeof DATA_RETENTION,
  createdAt: Date,
  contractEndDate?: Date
): boolean {
  const retentionPeriod = DATA_RETENTION[dataType];
  const years = parseInt(retentionPeriod.split(' ')[0]);
  
  const retentionEnd = new Date(createdAt);
  retentionEnd.setFullYear(retentionEnd.getFullYear() + years);
  
  // If contract has ended, also consider post-contract retention
  if (contractEndDate) {
    const postContractEnd = new Date(contractEndDate);
    postContractEnd.setFullYear(postContractEnd.getFullYear() + 6);
    
    // Return true if both retention periods have passed
    return new Date() > retentionEnd && new Date() > postContractEnd;
  }
  
  return new Date() > retentionEnd;
}

