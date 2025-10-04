import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function DataInspector() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const inspectData = async () => {
      // Get ALL your data
      const [intake, part2, config] = await Promise.all([
        supabase.from('client_intake').select('*').eq('user_id', user.id).single(),
        supabase.from('client_intake_part2').select('*').eq('user_id', user.id).single(),
        supabase.from('client_config').select('*').eq('user_id', user.id).single()
      ]);

      console.log('=== DATA STRUCTURE INSPECTION ===');
      
      // Intake data
      if (intake.data) {
        console.log('INTAKE RESPONSES:', intake.data.responses);
        console.log('Working hours from intake:', {
          time_commitment: intake.data.responses?.time_commitment,
          working_hours: intake.data.responses?.working_hours,
          time_commitment_hours: intake.data.responses?.time_commitment_hours
        });
      }

      // Part 2 data
      if (part2.data) {
        console.log('PART2 DATA:', {
          working_hours_now: part2.data.working_hours_now,
          validation_responses: part2.data.validation_responses,
          roadmap_generated: part2.data.roadmap_generated
        });
      }

      // Config data
      if (config.data) {
        console.log('CONFIG DATA:', {
          board: config.data.board,
          scores: config.data.scores,
          roadmap_keys: Object.keys(config.data.roadmap || {}),
          roadmap_structure: config.data.roadmap
        });
        
        // Check board scores format
        console.log('BOARD SCORES RAW:', config.data.scores);
        console.log('BOARD TYPE:', config.data.board);
        
        // Check roadmap structure
        if (config.data.roadmap) {
          console.log('ROADMAP WEEKS:', config.data.roadmap.three_month_sprint?.weeks);
          console.log('5 YEAR VISION:', config.data.roadmap.five_year_vision);
          console.log('6 MONTH SHIFT:', config.data.roadmap.six_month_shift);
        }
      }
    };

    inspectData();
  }, [user?.id]);

  return null;
} 