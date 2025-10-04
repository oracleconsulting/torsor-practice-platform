import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '../../../../contexts/AccountancyContext';
import { outreachService } from '../../../../services/accountancy/outreachService';
import PEMonitor from '../PEMonitor';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('@/contexts/AccountancyContext', () => ({
  useAccountancyContext: jest.fn()
}));

jest.mock('@/services/accountancy/outreachService', () => ({
  outreachService: {
    getPEAcquisitions: jest.fn()
  }
}));

const mockAcquisitions = [
  {
    id: '1',
    acquiring_firm: 'Advent International',
    target_firm: 'Smith & Co Accounting',
    acquisition_date: '2024-03-15',
    estimated_clients: 45,
    status: 'new',
    deal_value: '£25M',
    sector: 'Professional Services',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    acquiring_firm: 'KKR',
    target_firm: 'Johnson Accounting Partners',
    acquisition_date: '2024-03-10',
    estimated_clients: 30,
    status: 'processing',
    deal_value: '£18M',
    sector: 'Financial Services',
    created_at: '2024-03-10T10:00:00Z',
    updated_at: '2024-03-10T10:00:00Z'
  }
];

describe('PEMonitor', () => {
  const mockNavigate = jest.fn();
  const mockPractice = { id: 'practice-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAccountancyContext as jest.Mock).mockReturnValue({ practice: mockPractice });
    (outreachService.getPEAcquisitions as jest.Mock).mockResolvedValue(mockAcquisitions);
  });

  it('renders PE acquisitions correctly', async () => {
    render(<PEMonitor />);

    // Title should be present
    expect(screen.getByText('PE Acquisition Monitor')).toBeInTheDocument();

    // Wait for acquisitions to load
    expect(await screen.findByText('Advent International')).toBeInTheDocument();
    expect(screen.getByText('Smith & Co Accounting')).toBeInTheDocument();
    expect(screen.getByText('KKR')).toBeInTheDocument();
    expect(screen.getByText('Johnson Accounting Partners')).toBeInTheDocument();

    // Status badges should be present
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();

    // Client counts should be present
    expect(screen.getByText('45 potential clients')).toBeInTheDocument();
    expect(screen.getByText('30 potential clients')).toBeInTheDocument();

    // Sectors should be present
    expect(screen.getByText('Professional Services')).toBeInTheDocument();
    expect(screen.getByText('Financial Services')).toBeInTheDocument();

    // Monthly stats should be present
    expect(screen.getByText('2 acquisitions this month')).toBeInTheDocument();
  });

  it('navigates to analytics when View Analytics is clicked', async () => {
    render(<PEMonitor />);

    // Wait for component to load
    await screen.findByText('Advent International');

    // Click View Analytics button
    fireEvent.click(screen.getByText('View Analytics'));
    expect(mockNavigate).toHaveBeenCalledWith('/accountancy/outreach/pe/analytics');
  });

  it('navigates to extract clients page when Extract Clients is clicked', async () => {
    render(<PEMonitor />);

    // Wait for component to load
    await screen.findByText('Advent International');

    // Click Extract Clients button for first acquisition
    fireEvent.click(screen.getAllByText('Extract Clients')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/accountancy/outreach/pe/1/extract');
  });

  it('navigates to research page when Research Prospects is clicked', async () => {
    render(<PEMonitor />);

    // Wait for component to load
    await screen.findByText('Advent International');

    // Click Research Prospects button for first acquisition
    fireEvent.click(screen.getAllByText('Research Prospects')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/accountancy/outreach/pe/1/research');
  });

  it('handles loading state correctly', () => {
    (outreachService.getPEAcquisitions as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves to simulate loading
    );

    render(<PEMonitor />);
    expect(screen.getByText('Loading acquisitions...')).toBeInTheDocument();
  });

  it('handles empty state correctly', async () => {
    (outreachService.getPEAcquisitions as jest.Mock).mockResolvedValueOnce([]);

    render(<PEMonitor />);

    // Wait for empty state message
    expect(await screen.findByText('No recent acquisitions')).toBeInTheDocument();
    expect(screen.getByText('New PE acquisitions will appear here when detected')).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    (outreachService.getPEAcquisitions as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to load acquisitions')
    );

    render(<PEMonitor />);

    // Wait for error message
    expect(await screen.findByText('Error loading PE acquisitions')).toBeInTheDocument();
  });

  it('disables action buttons for completed acquisitions', async () => {
    const acquisitionsWithCompleted = [
      {
        ...mockAcquisitions[0],
        status: 'completed'
      }
    ];

    (outreachService.getPEAcquisitions as jest.Mock).mockResolvedValueOnce(acquisitionsWithCompleted);

    render(<PEMonitor />);

    // Wait for component to load
    await screen.findByText('Advent International');

    // Action buttons should be disabled
    const extractButton = screen.getByText('Extract Clients').closest('button');
    const researchButton = screen.getByText('Research Prospects').closest('button');

    expect(extractButton).toBeDisabled();
    expect(researchButton).toBeDisabled();
  });
}); 