import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Create default dashboard metrics
    await supabase.from('dashboard_metrics').upsert({
      user_id: user.id,
      revenue: 125847,
      revenue_growth: 23,
      business_health: 92,
      user_energy: 85
    });

    // Create default tasks
    const defaultTasks = [
      { user_id: user.id, task: 'Review Q3 Financials', urgent: true, time_estimate: '30 min', completed: false, order_index: 1 },
      { user_id: user.id, task: 'Marketing Strategy Call', urgent: false, time_estimate: '1 hr', completed: false, order_index: 2 },
      { user_id: user.id, task: 'Process Automation Setup', urgent: false, time_estimate: '45 min', completed: false, order_index: 3 }
    ];
    
    for (const task of defaultTasks) {
      await supabase.from('tasks').upsert(task);
    }

    return NextResponse.json({ success: true, message: 'Dashboard initialized' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}