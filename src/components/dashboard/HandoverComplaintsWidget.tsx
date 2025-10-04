import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, FileText, Clock, Shield } from 'lucide-react';
import type { HandoverComplaint } from '../../types/accountancy';
import { useNavigate } from 'react-router-dom';

interface Props {
  complaints: HandoverComplaint[];
  loading?: boolean;
}

export const HandoverComplaintsWidget: React.FC<Props> = ({ complaints = [], loading = false }) => {
  const navigate = useNavigate();

  const getSeverityColor = (severity: HandoverComplaint['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: HandoverComplaint['status']) => {
    switch (status) {
      case 'draft': return FileText;
      case 'submitted': return Clock;
      case 'investigating': return Shield;
      case 'escalated': return AlertTriangle;
      default: return ChevronRight;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-purple-500/20 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-purple-500/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-white">Handover Issues</h3>
        </div>
        <button
          onClick={() => navigate('/accountancy/complaints')}
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No active handover complaints</p>
          <button
            onClick={() => navigate('/accountancy/complaints/new')}
            className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Report New Issue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 2 }}
              onClick={() => navigate(`/accountancy/complaints/${complaint.id}`)}
              className={`cursor-pointer rounded-lg border p-4 ${getSeverityColor(complaint.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium mb-1">{complaint.clientName}</h4>
                  <p className="text-sm opacity-80">
                    {complaint.issues.length} issue{complaint.issues.length !== 1 ? 's' : ''} reported
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {React.createElement(getStatusIcon(complaint.status), {
                    className: 'w-4 h-4',
                  })}
                  <span className="text-sm capitalize">{complaint.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                <Shield className="w-3 h-3" />
                {complaint.regulatoryBody}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}; 