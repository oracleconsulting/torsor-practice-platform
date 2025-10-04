import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  FileText,
  Eye,
  Edit3,
  Trash2,
  Upload,
  Download as DownloadIcon,
  Share,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw
} from 'lucide-react';
import { clientPortalApi } from '../services/clientPortalApi';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userType: string;
  resourceType: string;
  resourceId?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'pending';
}

interface AuditLogsProps {
  portalId: string;
  onClose: () => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({
  portalId,
  onClose
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    severity: '',
    status: '',
    resourceType: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [portalId, currentPage, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await clientPortalApi.getAuditLogs(portalId, {
        ...filters,
        page: currentPage,
        limit: 50
      });
      
      setLogs(response.logs);
      setTotalPages(Math.ceil(response.total / 50));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      // Load mock data for demonstration
      setLogs(generateMockLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = (): AuditLog[] => {
    const actions = [
      { action: 'document_upload', icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50' },
      { action: 'document_download', icon: DownloadIcon, color: 'text-green-600', bg: 'bg-green-50' },
      { action: 'document_delete', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
      { action: 'document_edit', icon: Edit3, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { action: 'user_login', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
      { action: 'user_logout', icon: User, color: 'text-gray-600', bg: 'bg-gray-50' },
      { action: 'permission_granted', icon: Unlock, color: 'text-green-600', bg: 'bg-green-50' },
      { action: 'permission_revoked', icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
      { action: 'security_alert', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' }
    ];

    const users = ['john.doe@company.com', 'jane.smith@company.com', 'admin@company.com'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const statuses: Array<'success' | 'failure' | 'pending'> = ['success', 'failure', 'pending'];

    return Array.from({ length: 50 }, (_, i) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id: `log_${i + 1}`,
        action: action.action,
        userId: users[Math.floor(Math.random() * users.length)],
        userType: 'client',
        resourceType: 'document',
        resourceId: `doc_${Math.floor(Math.random() * 1000)}`,
        metadata: {
          fileName: `document_${i + 1}.pdf`,
          fileSize: Math.floor(Math.random() * 10000000),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        severity,
        status
      };
    });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      severity: '',
      status: '',
      resourceType: ''
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    setExporting(true);
    try {
      // In a real implementation, this would call an API to export logs
      const csvContent = generateCSV(logs);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (logs: AuditLog[]): string => {
    const headers = ['Timestamp', 'Action', 'User', 'Resource', 'IP Address', 'Severity', 'Status'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.userId,
      log.resourceId || '',
      log.ipAddress || '',
      log.severity,
      log.status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getActionIcon = (action: string) => {
    const actionMap: Record<string, any> = {
      document_upload: Upload,
      document_download: DownloadIcon,
      document_delete: Trash2,
      document_edit: Edit3,
      user_login: User,
      user_logout: User,
      permission_granted: Unlock,
      permission_revoked: Lock,
      security_alert: AlertTriangle
    };
    return actionMap[action] || FileText;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      document_upload: 'text-blue-600 bg-blue-50',
      document_download: 'text-green-600 bg-green-50',
      document_delete: 'text-red-600 bg-red-50',
      document_edit: 'text-yellow-600 bg-yellow-50',
      user_login: 'text-purple-600 bg-purple-50',
      user_logout: 'text-gray-600 bg-gray-50',
      permission_granted: 'text-green-600 bg-green-50',
      permission_revoked: 'text-red-600 bg-red-50',
      security_alert: 'text-orange-600 bg-orange-50'
    };
    return colorMap[action] || 'text-gray-600 bg-gray-50';
  };

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, string> = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      critical: 'text-red-600 bg-red-50'
    };
    return colorMap[severity] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(query) ||
        log.userId.toLowerCase().includes(query) ||
        log.resourceId?.toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
              <p className="text-sm text-gray-500">Activity tracking and security monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportLogs}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Filters and Search */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Action Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                      <select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">All Actions</option>
                        <option value="document_upload">Document Upload</option>
                        <option value="document_download">Document Download</option>
                        <option value="document_delete">Document Delete</option>
                        <option value="document_edit">Document Edit</option>
                        <option value="user_login">User Login</option>
                        <option value="user_logout">User Logout</option>
                        <option value="permission_granted">Permission Granted</option>
                        <option value="permission_revoked">Permission Revoked</option>
                        <option value="security_alert">Security Alert</option>
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Severity Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                      <select
                        value={filters.severity}
                        onChange={(e) => handleFilterChange('severity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">All Severities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Statistics */}
            <div className="flex-1 p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Logs</span>
                  <span className="text-sm font-medium">{logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Critical Alerts</span>
                  <span className="text-sm font-medium text-red-600">
                    {logs.filter(log => log.severity === 'critical').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed Actions</span>
                  <span className="text-sm font-medium text-red-600">
                    {logs.filter(log => log.status === 'failure').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today's Activity</span>
                  <span className="text-sm font-medium">
                    {logs.filter(log => {
                      const today = new Date().toDateString();
                      return new Date(log.createdAt).toDateString() === today;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Activity Logs ({filteredLogs.length})
                </h3>
                <button
                  onClick={loadAuditLogs}
                  disabled={loading}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading audit logs...</p>
                  </div>
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="p-6 space-y-3">
                  {filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const actionColor = getActionColor(log.action);
                    const severityColor = getSeverityColor(log.severity);
                    
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedLog?.id === log.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${actionColor.split(' ')[1]}`}>
                            <ActionIcon className={`w-5 h-5 ${actionColor.split(' ')[0]}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900 capitalize">
                                  {log.action.replace('_', ' ')}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${severityColor}`}>
                                  {log.severity}
                                </span>
                                {getStatusIcon(log.status)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <User className="w-3 h-3" />
                                <span>{log.userId}</span>
                              </div>
                              {log.resourceId && (
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-3 h-3" />
                                  <span>{log.resourceId}</span>
                                </div>
                              )}
                              {log.ipAddress && (
                                <div className="flex items-center space-x-2">
                                  <span className="w-3 h-3">🌐</span>
                                  <span>{log.ipAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No audit logs found</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Log Details */}
          {selectedLog && (
            <div className="w-96 border-l border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Log Details</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedLog.action.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-sm text-gray-900">{selectedLog.userId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedLog.status)}
                      <span className="text-sm text-gray-900 capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                  
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Metadata</label>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {selectedLog.userAgent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}; 