import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function useOracleData() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id) {
      console.log('[useOracleData] No user ID, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOracleData] Fetching data for user:', user.id);

      // Fetch all data - USING USER_ID as primary key as you specified
      const [part1Result, part2Result, configResult] = await Promise.all([
        supabase
          .from('client_intake')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        supabase
          .from('client_intake_part2')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        supabase
          .from('client_config')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      console.log('[useOracleData] Raw results:', {
        part1: part1Result,
        part2: part2Result,
        config: configResult
      });

      const part1Data = part1Result.data;
      const part2Data = part2Result.data;
      const configData = configResult.data;

      // Log the actual structure of configData
      console.log('[useOracleData] Config data structure:', {
        hasConfig: !!configData,
        board: configData?.board,
        scores: configData?.scores,
        rationale: configData?.rationale,
        roadmap: configData?.roadmap,
        recommended_board: configData?.recommended_board
      });

      // Extract group_id
      const groupId = part1Data?.group_id || part2Data?.group_id || configData?.group_id || '';

      // Extract business info
      const businessName = part1Data?.responses?.company_name || 
                          part1Data?.responses?.trading_name ||
                          'Your Business';

      // Extract revenue data
      const currentRevenue = extractRevenue(part1Data?.responses);
      const targetRevenue = parseFloat(
        part2Data?.validation_responses?.annual_revenue_target || '1000000'
      );

      // Extract working hours from validation_responses
      const workingHours = parseInt(
        part2Data?.validation_responses?.working_hours_per_week || '40'
      );
      const targetHours = parseInt(
        part2Data?.validation_responses?.target_working_hours || '30'
      );

      // Extract board data from client_config - CORRECTED PATHS
      // The board is stored directly in the board column, not board_recommendation
      const board = configData?.board || [];
      const boardScores = configData?.scores || {};
      const boardRationale = configData?.rationale || {};
      const boardComposition = configData?.board_composition || '';
      
      // Also check recommended_board as fallback
      const recommendedBoard = configData?.recommended_board;
      
      console.log('[useOracleData] Board extraction:', {
        board,
        boardScores,
        boardRationale,
        recommendedBoard
      });

      // Normalize board scores (convert decimals to percentages)
      const normalizedBoardScores: Record<string, number> = {};
      if (boardScores && typeof boardScores === 'object') {
        Object.entries(boardScores).forEach(([key, value]) => {
          if (typeof value === 'number') {
            normalizedBoardScores[key] = value <= 1 ? Math.round(value * 100) : Math.round(value);
          }
        });
      }

      // Extract roadmap data from config
      const roadmap = configData?.roadmap || {};
      const fiveYearVision = configData?.five_year_vision || roadmap.five_year_vision || {};
      const sixMonthShift = configData?.six_month_shift || roadmap.six_month_shift || {};
      const threeMonthSprint = configData?.three_month_sprint || roadmap.three_month_sprint || {};

      // Extract Part 3 data with proper structure
      let part3Data = null;
      if (part2Data?.part3_data) {
        // Get the actual part3_data structure
        const p3 = part2Data.part3_data;
        
        console.log('[useOracleData] Part 3 data structure:', {
          part3_data: p3,
          asset_scores: part2Data.asset_scores,
          value_gaps: part2Data.value_gaps,
          risk_register: part2Data.risk_register,
          value_analysis_data: part2Data.value_analysis_data,
          part3_complete: part2Data.part3_complete,
          value_analysis_generated: part2Data.value_analysis_generated
        });
        
        part3Data = {
          // These should be in part2 table columns, not nested
          asset_scores: part2Data.asset_scores || p3.asset_scores || {},
          value_gaps: Array.isArray(part2Data.value_gaps) ? part2Data.value_gaps : 
                     Array.isArray(p3.value_gaps) ? p3.value_gaps : [],
          risk_register: Array.isArray(part2Data.risk_register) ? part2Data.risk_register :
                        Array.isArray(p3.risk_register) ? p3.risk_register : [],
          action_plan: part2Data.action_plan || p3.action_plan || {},
          valuation_analysis: part2Data.value_analysis_data || p3.valuation_analysis || {}
        };
      }

      // Build final data object
      const oracleData = {
        // User & Business Info
        user,
        businessName,
        groupId,
        
        // Assessment Status
        part1Complete: part1Data?.completed || false,
        part2Complete: part2Data?.completed || false,
        part3Complete: part2Data?.part3_complete || false,
        validationComplete: part2Data?.validation_completed || false,
        roadmapGenerated: configData?.roadmap_generated || false,
        boardGenerated: !!configData?.board_generated_at,
        valueAnalysisGenerated: part2Data?.value_analysis_generated || false,
        
        // Business Metrics
        currentRevenue,
        targetRevenue,
        workingHours,
        targetHours,
        
        // Board Data - using the correct fields
        board: Array.isArray(board) ? board : [],
        boardScores: normalizedBoardScores,
        boardRationale,
        boardComposition,
        boardType: configData?.board_type,
        boardMetadata: configData?.board_metadata,
        
        // Roadmap Data
        fiveYearVision,
        sixMonthShift,
        threeMonthSprint,
        currentWeek: configData?.current_week || 0,
        sprintIteration: configData?.sprint_iteration || 1,
        
        // Part 3 Data
        part3Data,
        
        // Additional useful fields
        tier: configData?.tier || 1,
        fitMessage: part2Data?.fit_message || '',
        
        // Raw data for debugging
        rawData: {
          part1: part1Data,
          part2: part2Data,
          part3: part2Data?.part3_data,
          config: configData
        },
        
        // UI State
        loading: false,
        error: null,
        refreshData: fetchData
      };

      console.log('[useOracleData] Final oracle data:', oracleData);
      console.log('[useOracleData] Part 3 completion check:', {
        part3Complete: oracleData.part3Complete,
        part3Data: oracleData.part3Data,
        hasPart3Data: !!oracleData.part3Data,
        valueAnalysisGenerated: oracleData.valueAnalysisGenerated
      });
      setData(oracleData);

    } catch (err) {
      console.error('[useOracleData] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract revenue
  function extractRevenue(responses: any): number {
    if (!responses) return 0;
    
    // Try different possible fields
    const revenueFields = [
      'annual_turnover',
      'current_revenue',
      'revenue',
      'annual_revenue'
    ];
    
    for (const field of revenueFields) {
      if (responses[field]) {
        const value = responses[field];
        if (typeof value === 'string') {
          // Extract number from strings like "£60,000" or "60000"
          const cleanValue = value.replace(/[£$,]/g, '');
          const parsed = parseFloat(cleanValue);
          if (!isNaN(parsed)) return parsed;
        } else if (typeof value === 'number') {
          return value;
        }
      }
    }
    
    return 0;
  }

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Return loading state if still loading
  if (loading) {
    return {
      ...getEmptyData(),
      loading: true,
      refreshData: fetchData
    };
  }

  // Return error state if error
  if (error) {
    return {
      ...getEmptyData(),
      error,
      refreshData: fetchData
    };
  }

  // Return data or empty state
  return data || {
    ...getEmptyData(),
    refreshData: fetchData
  };
}

// Helper function to return empty data structure
function getEmptyData() {
  return {
    user: null,
    businessName: '',
    groupId: '',
    part1Complete: false,
    part2Complete: false,
    part3Complete: false,
    validationComplete: false,
    roadmapGenerated: false,
    boardGenerated: false,
    valueAnalysisGenerated: false,
    currentRevenue: 0,
    targetRevenue: 0,
    workingHours: 0,
    targetHours: 0,
    board: [],
    boardScores: {},
    boardRationale: {},
    boardComposition: '',
    boardType: null,
    boardMetadata: null,
    fiveYearVision: {},
    sixMonthShift: {},
    threeMonthSprint: {},
    currentWeek: 0,
    sprintIteration: 1,
    part3Data: null,
    tier: 1,
    fitMessage: '',
    rawData: {
      part1: null,
      part2: null,
      part3: null,
      config: null
    },
    loading: false,
    error: null
  };
}