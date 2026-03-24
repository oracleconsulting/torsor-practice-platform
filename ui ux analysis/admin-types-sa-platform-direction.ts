/** Stored in sa_engagements.platform_direction (JSONB) */
export interface SAPlatformDirection {
  financial_core: {
    platform: string;
    rationale: string;
    /** Free-text lines split into array on save */
    constraints: string[];
  };
  document_layer: {
    platform: string;
    rationale: string;
  };
  /** Ops backbone description, e.g. SEMS */
  operational_backbone: string;
  /** Inventory system names to retain */
  operational_keep: string[];
  /** Inventory system names to replace */
  must_replace: string[];
  notes: string;
}

export const SA_FINANCIAL_CORE_OPTIONS = [
  'Xero',
  'QuickBooks',
  'Sage',
  'FreeAgent',
  'Keep Current',
] as const;

export const SA_DOCUMENT_LAYER_OPTIONS = [
  'SharePoint/OneDrive',
  'Google Drive',
  'Dropbox',
  'Box',
  'Keep Current',
] as const;
