import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  Calendar,
  BarChart2,
  PieChart
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartssPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface ClientAnalyticsDashboardProps {
  clientId: string;
  dateRange: 'month' | 'quarter' | 'year';
}

export const ClientAnalyticsDashboard: React.FC<ClientAnalyticsDashboardProps> = ({
  clientId,
  dateRange
}) => {
  const [financialData, setFinancialData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [documentMetrics, setDocumentMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [clientId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [financial, compliance, documents] = await Promise.all([
        fetch(`/api/analytics/financial?client_id=${clientId}&range=${dateRange}`).then(r => r.json()),
        fetch(`/api/analytics/compliance?client_id=${clientId}`).then(r => r.json()),
        fetch(`/api/analytics/documents?client_id=${clientId}`).then(r => r.json())
      ]);

      setFinancialData(financial);
      setComplianceData(compliance);
      setDocumentMetrics(documents);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${financialData?.revenue?.current?.toLocaleString() || 0}
              </p>
            </div>
            <div className={`
              p-3 rounded-lg
              ${financialData?.revenue?.trend > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}
            `}>
              {financialData?.revenue?.trend > 0 ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
          </div>
          <p className={`
            text-sm flex items-center gap-1
            ${financialData?.revenue?.trend > 0 ? 'text-green-400' : 'text-red-400'}
          `}>
            {financialData?.revenue?.trend > 0 ? '+' : ''}{financialData?.revenue?.trend}%
            <span className="text-gray-400">vs last period</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Profit Margin</p>
              <p className="text-2xl font-bold text-white">
                {financialData?.profitMargin?.current || 0}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <BarChart2 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            ${financialData?.profit?.current?.toLocaleString() || 0} profit
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Compliance Score</p>
              <p className="text-2xl font-bold text-white">
                {complianceData?.score || 0}%
              </p>
            </div>
            <div className={`
              p-3 rounded-lg
              ${complianceData?.score >= 90 ? 'bg-green-500/20' : 
                complianceData?.score >= 70 ? 'bg-orange-500/20' : 'bg-red-500/20'}
            `}>
              <AlertTriangle className={`
                w-6 h-6
                ${complianceData?.score >= 90 ? 'text-green-400' : 
                  complianceData?.score >= 70 ? 'text-orange-400' : 'text-red-400'}
              `} />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {complianceData?.pendingActions || 0} actions pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Documents</p>
              <p className="text-2xl font-bold text-white">
                {documentMetrics?.total || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {documentMetrics?.recentUploads || 0} uploaded this month
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financialData?.revenueHistory || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartssPieChart>
              <Pie
                data={financialData?.expenseBreakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(financialData?.expenseBreakdown || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartssPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Compliance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Compliance Deadlines</h3>
        <div className="space-y-3">
          {complianceData?.deadlines?.map((deadline: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">{deadline.title}</p>
                  <p className="text-gray-400 text-sm">{deadline.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">
                  {new Date(deadline.date).toLocaleDateString()}
                </p>
                <p className={`
                  text-sm
                  ${deadline.daysRemaining <= 7 ? 'text-red-400' : 
                    deadline.daysRemaining <= 30 ? 'text-orange-400' : 'text-green-400'}
                `}>
                  {deadline.daysRemaining} days remaining
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 