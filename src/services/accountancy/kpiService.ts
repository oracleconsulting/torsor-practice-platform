import { supabase } from '@/lib/supabase/client';

export const kpiService = {
  async getKPIDashboard() {
    try {
      const response = await fetch('/api/accountancy/kpi/dashboard', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching KPI dashboard:', error);
      throw error;
    }
  },

  async updateKPIValue(kpiId: string, value: number) {
    try {
      const response = await fetch(`/api/accountancy/kpi/update/${kpiId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ value })
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating KPI:', error);
      throw error;
    }
  },

  async getPracticeInsights() {
    try {
      const response = await fetch('/api/accountancy/analytics/insights', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  },

  async exportKPIReport(format: 'pdf' | 'csv' | 'excel') {
    try {
      const response = await fetch(`/api/accountancy/kpi/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting KPI report:', error);
      throw error;
    }
  }
}; 