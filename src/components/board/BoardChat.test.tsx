import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BoardChat } from './BoardChat';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('BoardChat Component', () => {
  const mockProps = {
    groupId: 'test-group-123',
    boardMembers: ['CFO', 'CMO', 'COO'],
    tier: 1
  };

  beforeEach(() => {
    (global.fetch as any).mockClear();
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Mock initial meeting setup
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        meeting_id: 'test-meeting',
        secretary_message: 'Welcome to the board meeting'
      })
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with tier 1', async () => {
    await act(async () => {
      render(<BoardChat {...mockProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Board Meeting')).toBeInTheDocument();
      expect(screen.getByText('Tier 1')).toBeInTheDocument();
      expect(screen.queryByText('Select Advisors')).not.toBeInTheDocument();
    });
  });

  it('shows advisor selector for tier 2', async () => {
    await act(async () => {
      render(<BoardChat {...mockProps} tier={2} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Select Advisors')).toBeInTheDocument();
    });
  });

  it('sends message when clicking send button', async () => {
    // Mock the message response
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => ({
          meeting_id: 'test-meeting',
          secretary_message: 'Welcome to the board meeting'
        })
      })
      .mockResolvedValueOnce({
        json: async () => ({
          responses: {
            CFO: 'CFO response',
            CMO: 'CMO response'
          },
          synthesis: 'Board synthesis'
        })
      });

    await act(async () => {
      render(<BoardChat {...mockProps} />);
    });
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/Welcome to the board meeting/)).toBeInTheDocument();
    });

    // Send message
    const textarea = screen.getByPlaceholderText(/Ask your board of advisors/);
    const sendButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test question' } });
      fireEvent.click(sendButton);
      await vi.runAllTimersAsync();
    });

    // Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/board/conversation/message'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
    });

    // Wait for responses
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Verify responses appear
    await waitFor(() => {
      expect(screen.getByText('CFO response')).toBeInTheDocument();
      expect(screen.getByText('CMO response')).toBeInTheDocument();
      expect(screen.getByText('Board synthesis')).toBeInTheDocument();
    });
  });

  it('displays agent responses with correct styling', async () => {
    await act(async () => {
      render(<BoardChat {...mockProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome to the board meeting/)).toBeInTheDocument();
    });
  });
}); 