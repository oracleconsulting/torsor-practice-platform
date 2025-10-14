/**
 * API functions for Leadership Library book checkout system
 */

import { supabase } from '@/lib/supabase/client';

export interface BookCheckout {
  id: string;
  book_id: string;
  practice_member_id: string;
  checked_out_at: string;
  due_date: string;
  checked_in_at: string | null;
  notes: string | null;
  member_name?: string;
  member_email?: string;
  is_overdue?: boolean;
}

/**
 * Check if a book is currently available
 */
export async function isBookAvailable(bookId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('book_checkouts')
    .select('id')
    .eq('book_id', bookId)
    .is('checked_in_at', null)
    .limit(1);

  if (error) {
    console.error('Error checking book availability:', error);
    return false;
  }

  return !data || data.length === 0;
}

/**
 * Get current holder of a book
 */
export async function getCurrentBookHolder(bookId: string): Promise<BookCheckout | null> {
  const { data, error } = await supabase
    .from('book_checkouts')
    .select(`
      *,
      practice_members!inner(name, email)
    `)
    .eq('book_id', bookId)
    .is('checked_in_at', null)
    .order('checked_out_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const member = (data as any).practice_members;
  const now = new Date();
  const dueDate = new Date(data.due_date);

  return {
    ...data,
    member_name: member.name,
    member_email: member.email,
    is_overdue: dueDate < now
  };
}

/**
 * Check out a book
 */
export async function checkOutBook(
  bookId: string,
  practiceMemberId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // First check if book is available
  const available = await isBookAvailable(bookId);
  if (!available) {
    return { success: false, error: 'Book is currently checked out' };
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 21); // 3 weeks

  const { error } = await supabase
    .from('book_checkouts')
    .insert({
      book_id: bookId,
      practice_member_id: practiceMemberId,
      due_date: dueDate.toISOString(),
      notes
    });

  if (error) {
    console.error('Error checking out book:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check in a book
 */
export async function checkInBook(
  bookId: string,
  practiceMemberId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('book_checkouts')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('book_id', bookId)
    .eq('practice_member_id', practiceMemberId)
    .is('checked_in_at', null);

  if (error) {
    console.error('Error checking in book:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get checkout history for a book
 */
export async function getBookHistory(bookId: string): Promise<BookCheckout[]> {
  const { data, error } = await supabase
    .from('book_checkouts')
    .select(`
      *,
      practice_members!inner(name, email)
    `)
    .eq('book_id', bookId)
    .order('checked_out_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching book history:', error);
    return [];
  }

  return data.map(checkout => {
    const member = (checkout as any).practice_members;
    return {
      ...checkout,
      member_name: member.name,
      member_email: member.email
    };
  });
}

/**
 * Get all books checked out by a member
 */
export async function getMemberCheckouts(practiceMemberId: string): Promise<BookCheckout[]> {
  const { data, error } = await supabase
    .from('book_checkouts')
    .select('*')
    .eq('practice_member_id', practiceMemberId)
    .is('checked_in_at', null)
    .order('checked_out_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching member checkouts:', error);
    return [];
  }

  const now = new Date();
  return data.map(checkout => ({
    ...checkout,
    is_overdue: new Date(checkout.due_date) < now
  }));
}

/**
 * Get all overdue books
 */
export async function getOverdueBooks(): Promise<BookCheckout[]> {
  const { data, error } = await supabase
    .from('book_checkouts')
    .select(`
      *,
      practice_members!inner(name, email)
    `)
    .is('checked_in_at', null)
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error || !data) {
    console.error('Error fetching overdue books:', error);
    return [];
  }

  return data.map(checkout => {
    const member = (checkout as any).practice_members;
    return {
      ...checkout,
      member_name: member.name,
      member_email: member.email,
      is_overdue: true
    };
  });
}

