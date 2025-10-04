import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TeamWellnessWidget } from '../TeamWellnessWidget';
import { WellnessApiService } from '@/services/wellness/wellnessApiService';

// Mock the WellnessApiService
jest.mock('@/services/wellness/wellnessApiService');

describe('TeamWellnessWidget', () => {
  const mockTeamId = 'team-123';
  const mockSummary = {
    teamId: mockTeamId,
    department: 'Accounting',
    totalStaff: 10,
    averageScores: {
      overall: 85,
      energy: 80,
      workload: 75,
      engagement: 90,
      resilience: 85
    },
    statusBreakdown: {
      green: 7,
      amber: 2,
      red: 1
    },
    criticalAlerts: 1,
    recentPulseResponses: 8,
    lastUpdated: new Date()
  };

  const mockAlerts = [
    {
      type: 'warning' as const,
      message: 'High workload detected',
      suggestedAction: 'Consider redistributing tasks'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock the WellnessApiService methods
    (WellnessApiService.getInstance as jest.Mock).mockReturnValue({
      getTeamWellnessSummary: jest.fn().mockResolvedValue(mockSummary),
      getTeamAlerts: jest.fn().mockResolvedValue(mockAlerts)
    });
  });

  it('renders loading state initially', () => {
    render(<TeamWellnessWidget teamId={mockTeamId} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders team wellness data correctly', async () => {
    render(<TeamWellnessWidget teamId={mockTeamId} />);

    await waitFor(() => {
      expect(screen.getByText('Team Wellness')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('7 Green')).toBeInTheDocument();
      expect(screen.getByText('2 Amber')).toBeInTheDocument();
      expect(screen.getByText('1 Red')).toBeInTheDocument();
    });
  });

  it('renders critical alerts when present', async () => {
    render(<TeamWellnessWidget teamId={mockTeamId} />);

    await waitFor(() => {
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('High workload detected')).toBeInTheDocument();
      expect(screen.getByText('Consider redistributing tasks')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to load wellness data';
    (WellnessApiService.getInstance as jest.Mock).mockReturnValue({
      getTeamWellnessSummary: jest.fn().mockRejectedValue(new Error(errorMessage)),
      getTeamAlerts: jest.fn().mockResolvedValue([])
    });

    render(<TeamWellnessWidget teamId={mockTeamId} />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('navigates to full dashboard when clicked', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate
    }));

    render(<TeamWellnessWidget teamId={mockTeamId} />);

    await waitFor(() => {
      const dashboardButton = screen.getByText('View Full Dashboard');
      dashboardButton.click();
      expect(mockNavigate).toHaveBeenCalledWith('/wellness-dashboard');
    });
  });
}); 