import { Router } from 'express';
import { supabase } from '../../lib/supabase/client';
import type { HandoverComplaint, Evidence, HandoverIssue, TimelineEvent } from '../../types/accountancy';
import { validateComplaint } from './validators/complaints';

const router = Router();

// Get all complaints for a practice
router.get('/', async (req, res) => {
  try {
    const { practiceId } = req.user;
    const { data, error } = await supabase
      .from('handover_complaints')
      .select(`
        *,
        issues:handover_issues(*),
        evidence:handover_evidence(*),
        timeline:handover_timeline(*)
      `)
      .eq('practice_id', practiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get a single complaint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;

    const { data, error } = await supabase
      .from('handover_complaints')
      .select(`
        *,
        issues:handover_issues(*),
        evidence:handover_evidence(*),
        timeline:handover_timeline(*)
      `)
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching complaint:', err);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { practiceId } = req.user;
    const complaint = req.body as Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>;

    // Validate complaint data
    const validationError = validateComplaint(complaint);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { data, error } = await supabase
      .from('handover_complaints')
      .insert([{
        ...complaint,
        practice_id: practiceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update a complaint
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;
    const updates = req.body as Partial<HandoverComplaint>;

    const { error } = await supabase
      .from('handover_complaints')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('practice_id', practiceId);

    if (error) throw error;
    res.json({ message: 'Complaint updated successfully' });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// Delete a complaint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;

    const { error } = await supabase
      .from('handover_complaints')
      .delete()
      .eq('id', id)
      .eq('practice_id', practiceId);

    if (error) throw error;
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Error deleting complaint:', err);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// Add evidence to a complaint
router.post('/:id/evidence', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;
    const evidence = req.body as Omit<Evidence, 'id' | 'uploadedAt'>;

    // First verify complaint exists and belongs to practice
    const { data: complaint } = await supabase
      .from('handover_complaints')
      .select('id')
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const { data, error } = await supabase
      .from('handover_evidence')
      .insert([{
        ...evidence,
        complaint_id: id,
        uploaded_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error adding evidence:', err);
    res.status(500).json({ error: 'Failed to add evidence' });
  }
});

// Add an issue to a complaint
router.post('/:id/issues', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;
    const issue = req.body as Omit<HandoverIssue, 'id'>;

    // First verify complaint exists and belongs to practice
    const { data: complaint } = await supabase
      .from('handover_complaints')
      .select('id')
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const { data, error } = await supabase
      .from('handover_issues')
      .insert([{
        ...issue,
        complaint_id: id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error adding issue:', err);
    res.status(500).json({ error: 'Failed to add issue' });
  }
});

// Add a timeline event to a complaint
router.post('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceId } = req.user;
    const event = req.body as Omit<TimelineEvent, 'id' | 'timestamp'>;

    // First verify complaint exists and belongs to practice
    const { data: complaint } = await supabase
      .from('handover_complaints')
      .select('id')
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const { data, error } = await supabase
      .from('handover_timeline')
      .insert([{
        ...event,
        complaint_id: id,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error adding timeline event:', err);
    res.status(500).json({ error: 'Failed to add timeline event' });
  }
});

export { router as complaintsRouter }; 