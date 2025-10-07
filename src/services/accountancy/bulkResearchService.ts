/**
 * Bulk Research Service
 * 
 * Handles batch processing of hundreds of companies for AI research
 */

import { makeAuthenticatedRequest } from './outreachService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://oracle-api-server-production.up.railway.app';

export interface BulkResearchBatch {
  batch_id: string;
  batch_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  total_companies: number;
  completed_count: number;
  failed_count: number;
  pending_count: number;
  progress_percentage: number;
  estimated_completion?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BulkResearchResult {
  id: string;
  company_number: string;
  company_name: string;
  status: string;
  research_data?: any;
  error_message?: string;
  completed_at?: string;
}

export const bulkResearchService = {
  /**
   * Create a new bulk research batch
   */
  async createBatch(
    batchName: string,
    companies: any[],
    searchCriteria?: any,
    notificationEmail?: string
  ): Promise<{
    success: boolean;
    batch_id: string;
    batch_name: string;
    total_companies: number;
    queued_companies: number;
    estimated_completion: string;
    message: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/create`,
      {
        method: 'POST',
        body: JSON.stringify({
          batch_name: batchName,
          companies,
          search_criteria: searchCriteria,
          notification_email: notificationEmail
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create bulk research batch');
    }

    return await response.json();
  },

  /**
   * Get status and progress of a batch
   */
  async getBatchStatus(batchId: string): Promise<BulkResearchBatch> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/${batchId}/status`,
      {
        method: 'GET'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get batch status');
    }

    const data = await response.json();
    return data;
  },

  /**
   * Get results from a completed batch
   */
  async getBatchResults(
    batchId: string,
    page: number = 1,
    pageSize: number = 50,
    statusFilter?: string
  ): Promise<{
    success: boolean;
    batch_id: string;
    results: BulkResearchResult[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });

    if (statusFilter) {
      params.append('status_filter', statusFilter);
    }

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/${batchId}/results?${params}`,
      {
        method: 'GET'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get batch results');
    }

    return await response.json();
  },

  /**
   * List all batches for current practice
   */
  async listMyBatches(): Promise<{
    success: boolean;
    batches: BulkResearchBatch[];
    total: number;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/my-batches`,
      {
        method: 'GET'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list batches');
    }

    return await response.json();
  },

  /**
   * Pause a running batch
   */
  async pauseBatch(batchId: string): Promise<{ success: boolean; message: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/${batchId}/pause`,
      {
        method: 'POST'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to pause batch');
    }

    return await response.json();
  },

  /**
   * Resume a paused batch
   */
  async resumeBatch(batchId: string): Promise<{ success: boolean; message: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/bulk-research/${batchId}/resume`,
      {
        method: 'POST'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to resume batch');
    }

    return await response.json();
  }
};

