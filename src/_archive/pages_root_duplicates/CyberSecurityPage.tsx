import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  FileText, 
  Users, 
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Lock,
  Eye,
  BarChart3,
  Settings,
  Phone,
  Mail,
  ExternalLink,
  Download,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  ClipboardCheck
} from 'lucide-react';
import { CyberSecurityData, SecurityIncident, Vulnerability, Alert } from '../types/accountancy';

interface CyberSecurityPageProps {
  className?: string;
}

export const CyberSecurityPage: React.FC<CyberSecurityPageProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'threats' | 'incidents' | 'insurance' | 'partner'>('dashboard');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Mock comprehensive cyber security data
  const mockCyberSecurityData: CyberSecurityData = {
    id: 'cyber-001',
    practiceId: 'practice-001',
    lastAssessed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    
    securityScore: {
      overall: 78,
      lastUpdated: new Date(),
      trend: 'improving',
      categories: {
        technical: {
          score: 82,
          factors: {
            patchingStatus: 85,
            endpointProtection: 90,
            firewallConfig: 88,
            emailSecurity: 75,
            backupIntegrity: 95,
            encryptionStatus: 80
          }
        },
        human: {
          score: 72,
          factors: {
            mfaAdoption: 85,
            trainingCompletion: 70,
            phishingTestResults: 65,
            passwordStrength: 75,
            securityAwareness: 75
          }
        },
        process: {
          score: 80,
          factors: {
            incidentResponsePlan: true,
            dataClassification: true,
            accessControls: 85,
            auditFrequency: 90,
            vendorManagement: 75
          }
        },
        physical: {
          score: 85,
          factors: {
            deviceSecurity: 90,
            officeAccess: true,
            cleanDeskPolicy: true,
            visitorManagement: true
          }
        }
      }
    },
    
    systemHealth: {
      cloudSecurity: {
        provider: 'microsoft',
        securityScore: 85,
        complianceScore: 88,
        alerts: [
          {
            id: 'alert-001',
            type: 'security',
            severity: 'medium',
            title: 'Unusual login attempt detected',
            description: 'Login attempt from unrecognized location',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            acknowledged: false
          }
        ]
      },
      endpoints: {
        totalDevices: 12,
        protectedDevices: 11,
        lastScanDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        threatsFound: 2,
        quarantinedItems: 1
      },
      patching: {
        devicesUpToDate: 10,
        devicesPending: 2,
        criticalPatches: 1,
        lastPatchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextPatchWindow: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      backups: {
        lastSuccessful: new Date(Date.now() - 12 * 60 * 60 * 1000),
        nextScheduled: new Date(Date.now() + 12 * 60 * 60 * 1000),
        verificationStatus: 'verified',
        retentionDays: 30,
        offsiteBackup: true,
        encryptionEnabled: true
      }
    },
    
    vulnerabilities: {
      critical: [
        {
          id: 'vuln-001',
          cveId: 'CVE-2024-1234',
          title: 'Critical SQL Injection Vulnerability',
          description: 'Database server vulnerable to SQL injection attacks',
          severity: 'critical',
          cvssScore: 9.8,
          affectedSystems: ['Database Server'],
          discovered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'open',
          remediation: 'Apply security patch immediately',
          estimatedEffort: 'high'
        }
      ],
      high: [
        {
          id: 'vuln-002',
          title: 'Outdated SSL Certificate',
          description: 'SSL certificate expires in 30 days',
          severity: 'high',
          cvssScore: 7.5,
          affectedSystems: ['Web Server'],
          discovered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'in_progress',
          remediation: 'Renew SSL certificate',
          estimatedEffort: 'low'
        }
      ],
      medium: [],
      low: [],
      lastScanDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextScanDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      autoRemediationEnabled: true
    },
    
    incidents: {
      active: [
        {
          id: 'incident-001',
          type: 'phishing',
          severity: 'high',
          status: 'investigating',
          timeline: {
            detected: new Date(Date.now() - 4 * 60 * 60 * 1000),
            acknowledged: new Date(Date.now() - 3 * 60 * 60 * 1000)
          },
          impact: {
            affectedSystems: ['Email System'],
            affectedData: ['Client Communications'],
            affectedUsers: 3,
            businessImpact: 'moderate',
            dataExfiltrated: false,
            downtime: 120
          },
          response: {
            assignedTo: 'IT Partner',
            escalated: true,
            externalSupport: true,
            actionsToken: [
              {
                id: 'action-001',
                description: 'Isolate affected email accounts',
                status: 'completed',
                assignedTo: 'IT Partner',
                dueDate: new Date(Date.now() + 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
              }
            ]
          }
        }
      ],
      resolved: [],
      mttr: 4.5,
      statistics: {
        last30Days: 2,
        last90Days: 5,
        yearToDate: 8,
        trendsAnalysis: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 2, label: '30 days ago' },
          { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), value: 1, label: '20 days ago' },
          { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), value: 3, label: '10 days ago' },
          { date: new Date(), value: 1, label: 'Today' }
        ]
      }
    },
    
    insurance: {
      provider: 'CyberShield Insurance Ltd',
      policyNumber: 'CS-2024-001',
      coverageLimit: 1000000,
      excessAmount: 5000,
      premium: 2500,
      renewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      coverage: {
        dataBreachResponse: true,
        businessInterruption: true,
        cyberExtortion: true,
        networkSecurity: true,
        privacyLiability: true
      },
      requirements: {
        mfaRequired: true,
        backupRequired: true,
        trainingRequired: true,
        met: true
      }
    },
    
    partner: {
      name: 'SecureIT Solutions',
      status: 'connected',
      slaResponse: 15,
      services: {
        monitoring: true,
        patching: true,
        backups: true,
        incidentResponse: true,
        securityTraining: true
      },
      performance: {
        ticketsOpen: 2,
        avgResponseTime: 12,
        slaCompliance: 98,
        satisfaction: 4.5
      }
    }
  };

  const data = mockCyberSecurityData;

  const tabs = [
    { id: 'dashboard', label: 'Security Dashboard', icon: Shield },
    { id: 'threats', label: 'Threat Monitor', icon: AlertTriangle },
    { id: 'incidents', label: 'Incident Response', icon: Zap },
    { id: 'insurance', label: 'Insurance Hub', icon: FileText },
    { id: 'partner', label: 'Partner Portal', icon: Users }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Emergency Mode Banner */}
      {isEmergencyMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-900/50 border border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              <div>
                <h3 className="text-red-400 font-bold">EMERGENCY MODE ACTIVE</h3>
                <p className="text-red-300 text-sm">Critical security incident detected</p>
              </div>
            </div>
            <button
              onClick={() => setIsEmergencyMode(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Exit Emergency Mode
            </button>
          </div>
        </motion.div>
      )}

      {/* Overall Security Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Overall Security Score</h3>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">Improving</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(data.securityScore.overall)}`}>
                  {data.securityScore.overall}
                </div>
                <div className="text-gray-400">/ 100</div>
              </div>
              
              <div className="flex-1">
                <div className="space-y-3">
                  {Object.entries(data.securityScore.categories).map(([category, details]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreBgColor(details.score)}`}
                            style={{ width: `${details.score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(details.score)}`}>
                          {details.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Cloud Security</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-400 text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Endpoint Protection</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-400 text-sm">{data.systemHealth.endpoints.protectedDevices}/{data.systemHealth.endpoints.totalDevices}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Backup Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-400 text-sm">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/accountancy/cyber-security/survey"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                Take Security Survey
              </Link>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Run Security Scan
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <Database className="w-4 h-4" />
                Trigger Backup
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Report Incident
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {data.systemHealth.cloudSecurity.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <div className="text-white font-medium">{alert.title}</div>
                  <div className="text-gray-400 text-sm">{alert.description}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Critical Vulnerabilities</h3>
          <div className="space-y-3">
            {data.vulnerabilities.critical.map((vuln) => (
              <div key={vuln.id} className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-red-400 font-medium">{vuln.title}</div>
                  <div className="text-red-400 text-sm">CVSS {vuln.cvssScore}</div>
                </div>
                <div className="text-gray-300 text-sm mb-2">{vuln.description}</div>
                <div className="text-gray-400 text-xs">Status: {vuln.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderThreatMonitor = () => (
    <div className="space-y-6">
      {/* Threat Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{data.vulnerabilities.critical.length}</div>
          <div className="text-gray-400 text-sm">Critical</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-400">{data.vulnerabilities.high.length}</div>
          <div className="text-gray-400 text-sm">High</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{data.vulnerabilities.medium.length}</div>
          <div className="text-gray-400 text-sm">Medium</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{data.vulnerabilities.low.length}</div>
          <div className="text-gray-400 text-sm">Low</div>
        </div>
      </div>

      {/* Vulnerability Details */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Vulnerability Details</h3>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Scan Now
          </button>
        </div>
        
        <div className="space-y-4">
          {[...data.vulnerabilities.critical, ...data.vulnerabilities.high].map((vuln) => (
            <div key={vuln.id} className="border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-medium">{vuln.title}</div>
                  <div className="text-gray-400 text-sm">{vuln.description}</div>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(vuln.severity)}`}>
                  {vuln.severity.toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">CVSS Score:</span>
                  <div className="text-white font-medium">{vuln.cvssScore}</div>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className="text-white font-medium capitalize">{vuln.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-gray-400">Effort:</span>
                  <div className="text-white font-medium capitalize">{vuln.estimatedEffort}</div>
                </div>
                <div>
                  <span className="text-gray-400">Systems:</span>
                  <div className="text-white font-medium">{vuln.affectedSystems.join(', ')}</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Remediation:</div>
                <div className="text-white text-sm">{vuln.remediation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Schedule */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Scan Schedule</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Last Scan</div>
            <div className="text-white font-medium">
              {data.vulnerabilities.lastScanDate.toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Next Scan</div>
            <div className="text-white font-medium">
              {data.vulnerabilities.nextScanDate.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncidentResponse = () => (
    <div className="space-y-6">
      {/* Emergency Contacts */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Emergency Contacts</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="text-white font-medium">IT Partner</div>
            </div>
            <div className="text-gray-400 text-sm">SecureIT Solutions</div>
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-white">0800-CYBER-999</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="text-white font-medium">Cyber Insurance</div>
            </div>
            <div className="text-gray-400 text-sm">CyberShield Insurance</div>
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-white">0800-CLAIM-NOW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Incidents */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Active Incidents</h3>
          <button 
            onClick={() => setIsEmergencyMode(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Mode
          </button>
        </div>
        
        <div className="space-y-4">
          {data.incidents.active.map((incident) => (
            <div key={incident.id} className="border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-medium capitalize">
                    {incident.type.replace('_', ' ')} Incident
                  </div>
                  <div className="text-gray-400 text-sm">
                    Detected: {incident.timeline.detected.toLocaleString()}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                  {incident.severity.toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className="text-white font-medium capitalize">{incident.status}</div>
                </div>
                <div>
                  <span className="text-gray-400">Assigned:</span>
                  <div className="text-white font-medium">{incident.response.assignedTo}</div>
                </div>
                <div>
                  <span className="text-gray-400">Impact:</span>
                  <div className="text-white font-medium capitalize">{incident.impact.businessImpact}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                  View Details
                </button>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm">
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Statistics */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Incident Statistics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.incidents.statistics.last30Days}</div>
            <div className="text-gray-400 text-sm">Last 30 Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.incidents.statistics.last90Days}</div>
            <div className="text-gray-400 text-sm">Last 90 Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.incidents.statistics.yearToDate}</div>
            <div className="text-gray-400 text-sm">Year to Date</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.incidents.mttr}h</div>
            <div className="text-gray-400 text-sm">Mean Time to Resolve</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsuranceHub = () => (
    <div className="space-y-6">
      {/* Insurance Overview */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Cyber Insurance Policy</h3>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Certificate
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm">Provider</div>
                <div className="text-white font-medium">{data.insurance.provider}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Policy Number</div>
                <div className="text-white font-medium">{data.insurance.policyNumber}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Coverage Limit</div>
                <div className="text-white font-medium">£{data.insurance.coverageLimit.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Excess Amount</div>
                <div className="text-white font-medium">£{data.insurance.excessAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm">Annual Premium</div>
                <div className="text-white font-medium">£{data.insurance.premium.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Renewal Date</div>
                <div className="text-white font-medium">{data.insurance.renewalDate.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Requirements Met</div>
                <div className="flex items-center gap-2">
                  {data.insurance.requirements.met ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={data.insurance.requirements.met ? 'text-green-400' : 'text-red-400'}>
                    {data.insurance.requirements.met ? 'Compliant' : 'Non-Compliant'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Coverage Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(data.insurance.coverage).map(([coverage, included]) => (
            <div key={coverage} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="text-white font-medium capitalize">
                {coverage.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="flex items-center gap-2">
                {included ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={included ? 'text-green-400' : 'text-red-400'}>
                  {included ? 'Included' : 'Excluded'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Status */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Policy Requirements</h3>
        <div className="space-y-3">
          {Object.entries(data.insurance.requirements).filter(([key]) => key !== 'met').map(([requirement, met]) => (
            <div key={requirement} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="text-white font-medium capitalize">
                {requirement.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="flex items-center gap-2">
                {met ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={met ? 'text-green-400' : 'text-red-400'}>
                  {met ? 'Met' : 'Not Met'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPartnerPortal = () => (
    <div className="space-y-6">
      {/* Partner Status */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">IT Partner Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              data.partner.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <span className={`text-sm font-medium ${
              data.partner.status === 'connected' ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.partner.status.charAt(0).toUpperCase() + data.partner.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-2xl font-bold text-white mb-2">{data.partner.name}</div>
            <div className="text-gray-400 mb-4">SLA Response: {data.partner.slaResponse} minutes</div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Open Tickets</span>
                <span className="text-white font-medium">{data.partner.performance.ticketsOpen}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Avg Response Time</span>
                <span className="text-white font-medium">{data.partner.performance.avgResponseTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">SLA Compliance</span>
                <span className="text-white font-medium">{data.partner.performance.slaCompliance}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Satisfaction</span>
                <span className="text-white font-medium">{data.partner.performance.satisfaction}/5</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Services</h4>
            <div className="space-y-2">
              {Object.entries(data.partner.services).map(([service, active]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    {active ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={active ? 'text-green-400' : 'text-red-400'}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Partner
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          Create Ticket
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5" />
          View Reports
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="flex-1">
              <div className="text-white font-medium">Security scan completed</div>
              <div className="text-gray-400 text-sm">2 hours ago</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <div className="flex-1">
              <div className="text-white font-medium">Patch deployment scheduled</div>
              <div className="text-gray-400 text-sm">4 hours ago</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <div className="text-white font-medium">Backup verification successful</div>
              <div className="text-gray-400 text-sm">6 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'threats':
        return renderThreatMonitor();
      case 'incidents':
        return renderIncidentResponse();
      case 'insurance':
        return renderInsuranceHub();
      case 'partner':
        return renderPartnerPortal();
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen overflow-auto bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black uppercase text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#ff6b35]" />
                CYBER SECURITY SHIELD
              </h1>
              <p className="text-xl text-white/80 font-bold uppercase">
                Real-time security monitoring, incident response, and partner integration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/60">Last Updated</div>
                <div className="text-white font-medium">
                  {data.securityScore.lastUpdated.toLocaleString()}
                </div>
              </div>
              <button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-black uppercase">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-1 p-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="cyber-security-container" style={{ overflowY: 'auto', height: '100vh' }}>
            {renderTabContent()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CyberSecurityPage; 