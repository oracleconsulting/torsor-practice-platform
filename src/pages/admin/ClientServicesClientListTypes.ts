/**
 * Shared props type for ClientServicesClientList and ClientServicesClientListModals.
 */
import type React from 'react';
import type { Page } from '../../types/navigation';

export interface InviteFormState {
  email: string;
  name: string;
  company: string;
  services: string[];
  customMessage: string;
  inviteType: 'discovery' | 'direct';
}

export interface BulkImportResultItem {
  success?: boolean;
  name?: string;
  email?: string;
  password?: string;
  company?: string;
  error?: string;
}

export interface BulkImportSummary {
  succeeded?: number;
  total?: number;
  failed?: number;
  emailsSent?: number;
}

export interface BulkImportResults {
  summary?: BulkImportSummary;
  results?: BulkImportResultItem[];
}

export interface EditingServiceShape {
  id?: string;
  name?: string;
  short_description?: string;
  description?: string;
  price_amount?: number | string | null;
  price_period?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ClientServicesClientListProps {
  serviceLines: Array<{ id: string; name: string; code?: string; status?: string; icon?: React.ComponentType<{ className?: string }>; [key: string]: unknown }>;
  selectedServiceLine: string | null;
  setSelectedServiceLine: (id: string | null) => void;
  clients: Array<{ id: string; name: string; email?: string; company?: string; hasRoadmap?: boolean; progress?: number; [key: string]: unknown }>;
  filteredClients: unknown[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setShowInviteModal: (v: boolean) => void;
  setSelectedClient: (id: string | null) => void;
  selectedClient: string | null;
  fetchClients: () => void;
  handleDeleteClient: (id: string, name: string, email: string) => void;
  confirmDeleteClient: () => void;
  clientToDelete: { id: string; name: string; email: string } | null;
  setClientToDelete: (v: { id: string; name: string; email: string } | null) => void;
  deletingClient: string | null;
  setShowBulkImportModal: (v: boolean) => void;
  bulkImportResults: BulkImportResults | null;
  setBulkImportResults: (v: BulkImportResults | null) => void;
  editingService: EditingServiceShape | null;
  setEditingService: (v: EditingServiceShape | null) => void;
  handleDeleteService: (id: string) => void;
  savingService: boolean;
  deletingService: string | null;
  currentMember: { practice_id?: string } | null;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  getStatusColor: (status: string) => string;
  handleSaveService?: (service: unknown) => Promise<void>;
  DiscoveryClientModal?: React.ComponentType<any>;
  SystemsAuditClientModal?: React.ComponentType<any>;
  BenchmarkingClientModal?: React.ComponentType<any>;
  ClientDetailModal?: React.ComponentType<any>;
  showInviteModal?: boolean;
  inviteForm?: InviteFormState;
  setInviteForm?: (v: InviteFormState) => void;
  sendingInvite?: boolean;
  handleSendInvite?: () => Promise<void>;
  showBulkImportModal?: boolean;
  bulkImportData?: string;
  setBulkImportData?: (v: string) => void;
  bulkSendEmails?: boolean;
  setBulkSendEmails?: (v: boolean) => void;
  bulkImporting?: boolean;
  handleBulkImport?: () => Promise<void>;
}
