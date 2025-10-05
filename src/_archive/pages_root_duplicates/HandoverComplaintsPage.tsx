import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HandoverComplaintsWidget } from '../components/accountancy/dashboard/HandoverComplaintsWidget';
import { useHandoverComplaints } from '../hooks/useHandoverComplaints';
import type { HandoverComplaint } from '../types/accountancy';

export const HandoverComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, loading, error } = useHandoverComplaints();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredComplaints = complaints.filter((complaint: HandoverComplaint) => {
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || complaint.severity === filterSeverity;
    return matchesStatus && matchesSeverity;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Handover Complaints</h1>
          <p className="text-gray-400">
            Track and manage client handover issues with regulatory bodies
          </p>
        </div>
        <button
          onClick={() => navigate('/accountancy/complaints/new')}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Report Issue
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 ml-auto"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading complaints...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No complaints found</p>
          {(filterStatus !== 'all' || filterSeverity !== 'all') && (
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredComplaints.map((complaint) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <HandoverComplaintsWidget complaints={[complaint]} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}; 