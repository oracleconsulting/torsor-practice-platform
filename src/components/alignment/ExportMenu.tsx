import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  exportService,
  type ExportHistory
} from '../../services/alignmentEnhancementsService';
import { oracleMethodService } from '../../services/oracleMethodIntegration';

interface ExportMenuProps {
  practiceId: string;
  oracleGroupId: string;
  userId: string;
}

export function ExportMenu({ practiceId, oracleGroupId, userId }: ExportMenuProps) {
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportType, setReportType] = useState<'progress_report' | 'analytics_summary' | 'task_list' | 'full_roadmap'>('progress_report');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadExportHistory();
  }, [practiceId, oracleGroupId]);

  const loadExportHistory = async () => {
    const history = await exportService.getExportHistory(practiceId, oracleGroupId);
    setExportHistory(history);
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      // Fetch real client data for preview
      const clientProgress = await oracleMethodService.getClientProgress(oracleGroupId);
      setPreviewData(clientProgress);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      alert('Error loading preview data');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let result = null;

      switch (reportType) {
        case 'progress_report':
          result = await exportService.generateProgressReport(
            practiceId,
            oracleGroupId,
            exportType,
            userId
          );
          break;
        case 'analytics_summary':
          result = await exportService.exportAnalytics(
            practiceId,
            oracleGroupId,
            exportType === 'csv' ? 'excel' : exportType,
            userId
          );
          break;
        case 'task_list':
          result = await exportService.exportTaskList(
            practiceId,
            oracleGroupId,
            exportType === 'pdf' ? 'excel' : exportType as 'excel' | 'csv',
            userId
          );
          break;
        case 'full_roadmap':
          result = await exportService.generateProgressReport(
            practiceId,
            oracleGroupId,
            exportType,
            userId
          );
          break;
      }

      if (result) {
        // Simulate download (in production, this would be an actual file download)
        alert(`Report generated successfully! File size: ${(result.fileSize / 1024).toFixed(2)} KB\n\nIn production, this would download: ${result.url}`);
        
        // Reload history
        await loadExportHistory();
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error generating report');
    } finally {
      setExporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'progress_report':
      case 'full_roadmap':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'analytics_summary':
        return <TableCellsIcon className="w-5 h-5" />;
      case 'task_list':
        return <DocumentArrowDownIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800',
      excel: 'bg-green-100 text-green-800',
      csv: 'bg-blue-100 text-blue-800',
      json: 'bg-purple-100 text-purple-800'
    };
    return colors[format as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Export Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowDownTrayIcon className="w-6 h-6 mr-2 text-blue-600" />
            Export Reports
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate and download client progress reports in various formats
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Report Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { 
                    value: 'progress_report', 
                    label: 'Progress Report', 
                    description: 'Comprehensive client progress overview',
                    icon: DocumentTextIcon
                  },
                  { 
                    value: 'analytics_summary', 
                    label: 'Analytics Summary', 
                    description: 'Charts, trends, and insights',
                    icon: TableCellsIcon
                  },
                  { 
                    value: 'task_list', 
                    label: 'Task List', 
                    description: 'Detailed task breakdown',
                    icon: DocumentArrowDownIcon
                  },
                  { 
                    value: 'full_roadmap', 
                    label: 'Full Roadmap', 
                    description: '5-year vision to 3-month sprint',
                    icon: DocumentTextIcon
                  }
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setReportType(option.value as any)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        reportType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          reportType === option.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                        </div>
                        {reportType === option.value && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="flex space-x-3">
                {(['pdf', 'excel', 'csv'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportType(format)}
                    disabled={reportType === 'analytics_summary' && format === 'csv'}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                      exportType === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview & Export Buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Button
                onClick={handlePreview}
                disabled={loadingPreview}
                variant="outline"
                className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                {loadingPreview ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-5 h-5 mr-2" />
                    Preview Report
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Generate & Download Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ClockIcon className="w-6 h-6 mr-2 text-gray-600" />
              Export History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History ({exportHistory.length})
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {exportHistory.length === 0 ? (
              <div className="text-center py-8">
                <DocumentArrowDownIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No export history yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Generated reports will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getReportIcon(item.report_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.report_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <Badge className={getFormatBadge(item.export_type)}>
                            {item.export_type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          {item.file_size_bytes && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(item.file_size_bytes)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (item.file_url) {
                          alert(`Would download: ${item.file_url}`);
                          // In production: window.open(item.file_url, '_blank');
                        }
                      }}
                      disabled={!item.file_url}
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Exports</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            One-click exports for common reports
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setReportType('progress_report');
                setExportType('pdf');
                setTimeout(handleExport, 100);
              }}
              disabled={exporting}
              className="justify-start"
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Progress PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReportType('task_list');
                setExportType('excel');
                setTimeout(handleExport, 100);
              }}
              disabled={exporting}
              className="justify-start"
            >
              <TableCellsIcon className="w-4 h-4 mr-2" />
              Tasks Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReportType('analytics_summary');
                setExportType('pdf');
                setTimeout(handleExport, 100);
              }}
              disabled={exporting}
              className="justify-start"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Analytics PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {exportType.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Client Header */}
                <div className="text-center border-b border-gray-200 pb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {previewData.business_name || 'Client Progress Report'}
                  </h1>
                  <p className="text-gray-600">{previewData.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Generated: {new Date().toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* 5-Year Vision */}
                {reportType === 'full_roadmap' || reportType === 'progress_report' ? (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 5-Year Vision</h2>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg space-y-6">
                        <div>
                          <h3 className="font-bold text-xl mb-2">{previewData.roadmap?.five_year_vision?.title || 'Vision Title'}</h3>
                          {previewData.roadmap?.five_year_vision?.description && (
                            <p className="text-gray-700 italic mb-4">{previewData.roadmap.five_year_vision.description}</p>
                          )}
                        </div>

                        {/* Vision Narrative (Full transformation story) */}
                        {previewData.roadmap?.five_year_vision?.vision_narrative && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">Transformation Story</h4>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                              {previewData.roadmap.five_year_vision.vision_narrative}
                            </div>
                          </div>
                        )}

                        {/* North Star & Archetype */}
                        {(previewData.roadmap?.five_year_vision?.north_star || previewData.roadmap?.five_year_vision?.archetype) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {previewData.roadmap.five_year_vision.north_star && (
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <h4 className="font-semibold text-gray-900 mb-2">⭐ North Star</h4>
                                <p className="text-sm text-gray-700">{previewData.roadmap.five_year_vision.north_star}</p>
                              </div>
                            )}
                            {previewData.roadmap.five_year_vision.archetype && (
                              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h4 className="font-semibold text-gray-900 mb-2">🎭 Archetype</h4>
                                <p className="text-sm text-gray-700">{previewData.roadmap.five_year_vision.archetype}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Emotional Core */}
                        {previewData.roadmap?.five_year_vision?.emotional_core && (
                          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                            <h4 className="font-semibold text-gray-900 mb-2">💖 Emotional Core</h4>
                            <p className="text-sm text-gray-700">{previewData.roadmap.five_year_vision.emotional_core}</p>
                          </div>
                        )}
                        
                        {/* Year Milestones - FULL DETAIL */}
                        {previewData.roadmap?.five_year_vision?.year_1 && (
                          <div className="mt-6 space-y-6">
                            <h4 className="font-bold text-lg text-gray-900">Milestone Journey</h4>
                            
                            {/* Year 1 */}
                            <div className="bg-white p-5 rounded-lg border-l-4 border-blue-400">
                              <h5 className="font-bold text-gray-900 text-lg mb-2">Year 1: {previewData.roadmap.five_year_vision.year_1.headline}</h5>
                              {previewData.roadmap.five_year_vision.year_1.story && (
                                <p className="text-gray-700 mb-3 leading-relaxed">{previewData.roadmap.five_year_vision.year_1.story}</p>
                              )}
                              {previewData.roadmap.five_year_vision.year_1.measurable && (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Measurables</p>
                                  <p className="text-sm text-gray-800">{previewData.roadmap.five_year_vision.year_1.measurable}</p>
                                </div>
                              )}
                            </div>

                            {/* Year 3 */}
                            {previewData.roadmap.five_year_vision.year_3 && (
                              <div className="bg-white p-5 rounded-lg border-l-4 border-green-400">
                                <h5 className="font-bold text-gray-900 text-lg mb-2">Year 3: {previewData.roadmap.five_year_vision.year_3.headline}</h5>
                                {previewData.roadmap.five_year_vision.year_3.story && (
                                  <p className="text-gray-700 mb-3 leading-relaxed">{previewData.roadmap.five_year_vision.year_3.story}</p>
                                )}
                                {previewData.roadmap.five_year_vision.year_3.measurable && (
                                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Measurables</p>
                                    <p className="text-sm text-gray-800">{previewData.roadmap.five_year_vision.year_3.measurable}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Year 5 */}
                            {previewData.roadmap.five_year_vision.year_5 && (
                              <div className="bg-white p-5 rounded-lg border-l-4 border-purple-400">
                                <h5 className="font-bold text-gray-900 text-lg mb-2">Year 5: {previewData.roadmap.five_year_vision.year_5.headline}</h5>
                                {previewData.roadmap.five_year_vision.year_5.story && (
                                  <p className="text-gray-700 mb-3 leading-relaxed">{previewData.roadmap.five_year_vision.year_5.story}</p>
                                )}
                                {previewData.roadmap.five_year_vision.year_5.measurable && (
                                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Measurables</p>
                                    <p className="text-sm text-gray-800">{previewData.roadmap.five_year_vision.year_5.measurable}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Strategic Pillars */}
                        {previewData.roadmap?.five_year_vision?.strategic_pillars && previewData.roadmap.five_year_vision.strategic_pillars.length > 0 && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">🎯 Strategic Pillars</h4>
                            <ul className="space-y-2">
                              {previewData.roadmap.five_year_vision.strategic_pillars.map((pillar: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-600 mr-2">▸</span>
                                  <span className="text-sm text-gray-700">{pillar}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6-Month Shift */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 6-Month Shift</h2>
                      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                        <h3 className="font-bold text-lg mb-2">{previewData.roadmap?.six_month_shift?.title || 'Current Focus'}</h3>
                        <p className="text-gray-700">{previewData.roadmap?.six_month_shift?.description || 'Description will appear here'}</p>
                      </div>
                    </div>

                    {/* 3-Month Sprint */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ 3-Month Sprint</h2>
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
                        <h3 className="font-bold text-lg mb-2">Sprint {previewData.roadmap?.three_month_sprint?.sprint_number || 1}</h3>
                        <p className="text-gray-700 mb-4">{previewData.roadmap?.three_month_sprint?.theme || 'Sprint theme'}</p>
                        {previewData.tasks && previewData.tasks.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Active Tasks:</h4>
                            <ul className="space-y-2">
                              {previewData.tasks.slice(0, 5).map((task: any, idx: number) => (
                                <li key={idx} className="flex items-center text-sm">
                                  <span className={`w-4 h-4 rounded mr-2 ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {task.task_name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Task List Preview */}
                {reportType === 'task_list' && previewData.tasks && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Task List</h2>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Task</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Week</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.tasks.slice(0, 10).map((task: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-900">{task.task_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">Week {task.week_number}</td>
                              <td className="px-4 py-3">
                                <Badge className={task.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {task.completed ? 'Complete' : 'Pending'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                This is a preview. Click "Generate & Download" to create the actual file.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    handleExport();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

