import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { renderHook, act } from '@testing-library/react';
import { supabase } from '../../lib/supabase/client';
import { ROLES, PORTAL_REQUIRED_ROLES } from '../../constants/roles';

// Mock Supabase client
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}));

describe('Role System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns correct role on signup', async () => {
    // Mock successful signup
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    (supabase.auth.signUp as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Mock role assignment
    (supabase.from as any)().select().eq().single.mockResolvedValue({
      data: { id: 'role-id' },
      error: null
    });
    (supabase.from as any)().insert.mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password', {
        portal_type: 'oracle'
      });
    });

    // Verify role assignment
    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    expect(supabase.from).toHaveBeenCalledWith('role_assignments');
  });

  it('checks portal access correctly', async () => {
    // Mock user with multiple roles
    const mockRoles = [
      { id: '1', name: ROLES.SUPER_ADMIN, permissions: {} },
      { id: '2', name: ROLES.USER, permissions: {} }
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set roles manually (would normally happen through context)
    (result.current as any).userRoles = mockRoles;

    // Super admin should have access to all portals
    expect(result.current.canAccessPortal('oracle')).toBe(true);
    expect(result.current.canAccessPortal('accountancy')).toBe(true);
    expect(result.current.canAccessPortal('client')).toBe(true);
  });

  it('prevents cross-portal access', async () => {
    // Mock regular user
    const mockRoles = [
      { id: '1', name: ROLES.USER, permissions: {} }
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set roles manually
    (result.current as any).userRoles = mockRoles;

    // Regular user should only access Oracle portal
    expect(result.current.canAccessPortal('oracle')).toBe(true);
    expect(result.current.canAccessPortal('accountancy')).toBe(false);
    expect(result.current.canAccessPortal('client')).toBe(false);
  });

  it('handles special case users correctly', async () => {
    // Mock james@ivcaccounting.co.uk
    const mockUser = { 
      id: 'james-id',
      email: 'james@ivcaccounting.co.uk',
      user_metadata: {}
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock role assignments query
    (supabase.from as any)().select().eq.mockResolvedValue({
      data: [
        { user_roles: { id: '1', name: ROLES.SUPER_ADMIN, permissions: {} } },
        { user_roles: { id: '2', name: ROLES.ADMIN, permissions: {} } }
      ],
      error: null
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('james@ivcaccounting.co.uk', 'password');
    });

    // Verify James has access to all portals
    expect(result.current.canAccessPortal('oracle')).toBe(true);
    expect(result.current.canAccessPortal('accountancy')).toBe(true);
    expect(result.current.canAccessPortal('client')).toBe(true);
  });
}); 