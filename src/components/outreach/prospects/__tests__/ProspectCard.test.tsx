import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProspectCard from '../ProspectCard';

const mockProspect = {
  id: '123',
  name: 'John Smith',
  company: 'Acme Corp',
  position: 'CFO',
  industry: 'Technology',
  score: 85,
  status: 'new' as const,
  personalization_data: {
    opening_hook: 'I noticed your recent PE acquisition...',
    pe_context: 'Recently acquired by XYZ Capital',
    research_insights: [
      'Growing tech company',
      'Recent expansion into new markets',
      'Looking for accounting support'
    ]
  },
  created_at: '2024-03-15T10:00:00Z',
  updated_at: '2024-03-15T10:00:00Z'
};

describe('ProspectCard', () => {
  it('renders prospect information correctly', () => {
    render(<ProspectCard prospect={mockProspect} />);

    // Basic information
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('CFO at Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('85% Match')).toBeInTheDocument();

    // Status
    expect(screen.getByText('New')).toBeInTheDocument();

    // Personalization data
    expect(screen.getByText('I noticed your recent PE acquisition...')).toBeInTheDocument();
    expect(screen.getByText('Recently acquired by XYZ Capital')).toBeInTheDocument();
    expect(screen.getByText('Growing tech company')).toBeInTheDocument();
    expect(screen.getByText('Recent expansion into new markets')).toBeInTheDocument();
    expect(screen.getByText('Looking for accounting support')).toBeInTheDocument();
  });

  it('calls onGenerateOutreach when Generate Outreach button is clicked', () => {
    const onGenerateOutreach = jest.fn();
    render(
      <ProspectCard
        prospect={mockProspect}
        onGenerateOutreach={onGenerateOutreach}
      />
    );

    fireEvent.click(screen.getByText('Generate Outreach'));
    expect(onGenerateOutreach).toHaveBeenCalledWith(mockProspect.id);
  });

  it('calls onViewDetails when View Details button is clicked', () => {
    const onViewDetails = jest.fn();
    render(
      <ProspectCard
        prospect={mockProspect}
        onViewDetails={onViewDetails}
      />
    );

    fireEvent.click(screen.getByText('View Details'));
    expect(onViewDetails).toHaveBeenCalledWith(mockProspect.id);
  });

  it('renders without personalization data', () => {
    const prospectWithoutPersonalization = {
      ...mockProspect,
      personalization_data: undefined
    };

    render(<ProspectCard prospect={prospectWithoutPersonalization} />);

    // Basic information should still be present
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('CFO at Acme Corp')).toBeInTheDocument();

    // Personalization sections should not be present
    expect(screen.queryByText('Personalized Approach')).not.toBeInTheDocument();
    expect(screen.queryByText('PE Context')).not.toBeInTheDocument();
    expect(screen.queryByText('Research Insights')).not.toBeInTheDocument();
  });

  it('renders with partial personalization data', () => {
    const prospectWithPartialPersonalization = {
      ...mockProspect,
      personalization_data: {
        opening_hook: 'I noticed your recent PE acquisition...',
        pe_context: undefined,
        research_insights: undefined
      }
    };

    render(<ProspectCard prospect={prospectWithPartialPersonalization} />);

    // Only opening hook should be present
    expect(screen.getByText('I noticed your recent PE acquisition...')).toBeInTheDocument();
    expect(screen.queryByText('PE Context')).not.toBeInTheDocument();
    expect(screen.queryByText('Research Insights')).not.toBeInTheDocument();
  });
}); 