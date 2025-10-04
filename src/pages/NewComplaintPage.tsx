import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HandoverComplaintForm } from '../components/accountancy/complaints/HandoverComplaintForm';
import { useHandoverComplaints } from '../hooks/useHandoverComplaints';
import type { HandoverComplaint } from '../types/accountancy';
import { toast } from 'sonner';

export const NewComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { createComplaint } = useHandoverComplaints();

  const handleSubmit = async (complaint: Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createComplaint(complaint);
      toast.success('Complaint submitted successfully');
      navigate('/accountancy/complaints');
    } catch (err) {
      console.error('Error submitting complaint:', err);
      toast.error('Failed to submit complaint');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Report Handover Issue</h1>
        <p className="text-gray-400">
          Document client handover problems for regulatory reporting
        </p>
      </div>

      {/* Form */}
      <HandoverComplaintForm onSubmit={handleSubmit} />
    </div>
  );
}; 