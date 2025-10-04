import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { GlassCard } from '../components/accountancy/ui/GlassCard';
import { ProgressRing } from '../components/accountancy/ui/ProgressRing';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';

const LOCAL_STORAGE_KEY = 'practice-health-progress';

const AccountancyHealth = () => {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [practiceName, setPracticeName] = useState<string | null>(null);

  const sections = [
    {
      title: "Compliance & Governance",
      icon: "📋",
      description: "Professional standards and regulatory compliance",
      questions: [
        { id: 'gdpr', text: 'Are your GDPR policies documented and regularly updated?' },
        { id: 'pii', text: 'Is your professional indemnity insurance current and adequate?' },
        { id: 'aml', text: 'Do you have comprehensive AML procedures in place?' },
        { id: 'client_money', text: 'Are client money handling procedures fully compliant?' },
        { id: 'data_breach', text: 'Is a data breach response plan documented and tested?' },
        { id: 'risk_assessment', text: 'Do you conduct regular practice risk assessments?' },
        { id: 'file_reviews', text: 'Are client file reviews conducted systematically?' }
      ]
    },
    {
      title: "Team Development", 
      icon: "👥",
      description: "Skills, training, and professional development",
      questions: [
        { id: 'cpd_compliance', text: 'Are all team members CPD compliant for the current year?' },
        { id: 'skills_matrix', text: 'Have you completed a comprehensive team skills matrix?' },
        { id: 'training_budget', text: 'Is adequate training budget allocated and ring-fenced?' },
        { id: 'supervision', text: 'Are supervision arrangements documented and followed?' },
        { id: 'succession', text: 'Do you have a written succession plan for key roles?' },
        { id: 'performance', text: 'Are annual performance reviews conducted for all staff?' },
        { id: 'career_paths', text: 'Are clear career progression paths defined?' }
      ]
    },
    {
      title: "Client Management",
      icon: "🤝", 
      description: "Client relationships and service delivery",
      questions: [
        { id: 'engagement_letters', text: 'Are engagement letters updated and comprehensive?' },
        { id: 'client_satisfaction', text: 'Do you regularly measure client satisfaction?' },
        { id: 'complaints', text: 'Is there a formal complaints handling procedure?' },
        { id: 'communication', text: 'Do you have structured client communication processes?' },
        { id: 'value_proposition', text: 'Is your value proposition clearly defined and communicated?' },
        { id: 'client_retention', text: 'Do you actively monitor and manage client retention?' },
        { id: 'onboarding', text: 'Is there a standardized client onboarding process?' }
      ]
    },
    {
      title: "Advisory Readiness",
      icon: "🎯",
      description: "Advisory services capability and delivery",
      questions: [
        { id: 'advisory_services', text: 'Do you offer clearly defined advisory service packages?' },
        { id: 'advisory_pricing', text: 'Have you implemented value-based pricing for advisory work?' },
        { id: 'business_planning', text: 'Do you help clients with strategic business planning?' },
        { id: 'kpi_dashboards', text: 'Do you provide regular KPI dashboards to clients?' },
        { id: 'advisory_meetings', text: 'Are regular advisory meetings scheduled with suitable clients?' },
        { id: 'industry_expertise', text: 'Have team members developed sector-specific expertise?' },
        { id: 'technology_advice', text: 'Do you provide technology and systems advice to clients?' }
      ]
    },
    {
      title: "Financial Health",
      icon: "💰",
      description: "Practice profitability and financial management", 
      questions: [
        { id: 'pricing_strategy', text: 'Do you have a documented pricing strategy?' },
        { id: 'profit_margins', text: 'Are profit margins monitored by service line?' },
        { id: 'cash_flow', text: 'Is cash flow actively managed and forecasted?' },
        { id: 'fee_recovery', text: 'Are time recording and fee recovery rates optimal?' },
        { id: 'overhead_control', text: 'Are overhead costs regularly reviewed and controlled?' },
        { id: 'financial_reporting', text: 'Do you produce monthly management accounts?' },
        { id: 'budgeting', text: 'Is there an annual budget with regular variance analysis?' }
      ]
    },
    {
      title: "Technology & Systems",
      icon: "💻",
      description: "Technology infrastructure and digital capabilities",
      questions: [
        { id: 'practice_software', text: 'Is your practice management software fit for purpose?' },
        { id: 'cloud_security', text: 'Are cloud security measures properly implemented?' },
        { id: 'automation', text: 'Have you implemented process automation where appropriate?' },
        { id: 'remote_working', text: 'Are remote working capabilities fully established?' },
        { id: 'data_backup', text: 'Are data backup and disaster recovery plans tested?' },
        { id: 'digital_communication', text: 'Do you use digital client communication tools?' },
        { id: 'paperless', text: 'Are you working towards a paperless office environment?' }
      ]
    }
  ];

  const calculateSectionScore = (sectionIndex) => {
    const sectionQuestions = sections[sectionIndex].questions;
    const sectionAnswers = sectionQuestions.map(q => answers[q.id]).filter(Boolean);
    
    if (sectionAnswers.length === 0) return 0;
    
    const yesCount = sectionAnswers.filter(a => a === 'yes').length;
    const partialCount = sectionAnswers.filter(a => a === 'partial').length;
    
    return Math.round(((yesCount * 100) + (partialCount * 50)) / (sectionAnswers.length * 100) * 100);
  };

  const calculateOverallScore = () => {
    const sectionScores = sections.map((_, index) => calculateSectionScore(index));
    const validScores = sectionScores.filter(score => score > 0);
    
    if (validScores.length === 0) return 0;
    
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#10b981]';
    if (score >= 60) return 'text-[#f59e0b]';
    return 'text-[#ef4444]';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return { icon: CheckCircle, text: 'EXCELLENT', color: 'green' };
    if (score >= 60) return { icon: AlertCircle, text: 'GOOD', color: 'amber' };
    return { icon: XCircle, text: 'NEEDS ATTENTION', color: 'red' };
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const isCurrentSectionComplete = () => {
    const currentQuestions = sections[currentSection].questions;
    return currentQuestions.every(q => answers[q.id]);
  };

  const generateRecommendations = () => {
    const recommendations = [];
    
    sections.forEach((section, sectionIndex) => {
      const score = calculateSectionScore(sectionIndex);
      if (score < 70) {
        const lowScoringQuestions = section.questions.filter(q => answers[q.id] !== 'yes');
        if (lowScoringQuestions.length > 0) {
          recommendations.push({
            section: section.title,
            priority: score < 50 ? 'HIGH' : 'MEDIUM',
            action: `IMPROVE ${section.title.toUpperCase()} - FOCUS ON ${lowScoringQuestions.length} AREAS`,
            impact: score < 50 ? 'CRITICAL FOR PRACTICE HEALTH' : 'IMPORTANT FOR GROWTH'
          });
        }
      }
    });
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  };

  const saveResults = () => {
    const results = {
      overallScore: calculateOverallScore(),
      sectionScores: sections.map((_, index) => ({
        section: sections[index].title,
        score: calculateSectionScore(index)
      })),
      answers,
      recommendations: generateRecommendations(),
      timestamp: new Date().toISOString(),
      completedSections: sections.length
    };
    
    localStorage.setItem('practice-health-results', JSON.stringify(results));
    setIsComplete(true);
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      saveResults();
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Load progress from backend/localStorage on mount
  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      if (user) {
        // Try to load from Supabase
        const { data, error } = await supabase
          .from('practice_health_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setAnswers(data.answers || {});
          setCurrentSection(data.current_section || 0);
        } else {
          // fallback to localStorage
          const local = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (local) {
            const parsed = JSON.parse(local);
            setAnswers(parsed.answers || {});
            setCurrentSection(parsed.currentSection || 0);
          }
        }
      } else {
        // Not logged in: use localStorage
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          setAnswers(parsed.answers || {});
          setCurrentSection(parsed.currentSection || 0);
        }
      }
      setLoading(false);
    };
    loadProgress();
  }, [user]);

  // Persist progress to backend/localStorage on every change
  useEffect(() => {
    if (loading) return;
    const persist = async () => {
      if (user) {
        await supabase.from('practice_health_progress').upsert({
          user_id: user.id,
          answers,
          current_section: currentSection,
          updated_at: new Date().toISOString(),
        });
      }
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ answers, currentSection })
      );
    };
    persist();
  }, [answers, currentSection, user, loading]);

  // Fetch/display practice name (TODO: replace with real practice name if available)
  useEffect(() => {
    if (user) {
      // Try to get from user metadata
      setPracticeName(user.user_metadata?.practiceName || user.user_metadata?.practice_name || null);
      // TODO: Fetch from practice context or Supabase if needed
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#1a2b4a] font-black uppercase">LOADING...</div>;
  }

  if (isComplete) {
    const overallScore = calculateOverallScore();
    const status = getScoreStatus(overallScore);
    
    return (
      <div className="min-h-screen bg-[#1a2b4a] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-black uppercase text-[#f5f1e8] mb-4">
              PRACTICE HEALTH ASSESSMENT RESULTS
            </h1>
            <p className="text-xl text-[#f5f1e8] font-bold uppercase">
              YOUR COMPREHENSIVE PRACTICE EVALUATION IS COMPLETE
            </p>
          </motion.div>

          {/* Overall Score */}
          <div className="relative group mb-8 text-center">
            <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
            <div className="relative bg-white border-2 border-[#1a2b4a] p-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
                <div>
                  <ProgressRing progress={overallScore} size={180} label="OVERALL SCORE" />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-3 mb-4">
                    <status.icon className={`w-8 h-8 text-[#${status.color === 'green' ? '10b981' : status.color === 'amber' ? 'f59e0b' : 'ef4444'}]`} />
                    <span className={`text-2xl font-black uppercase text-[#${status.color === 'green' ? '10b981' : status.color === 'amber' ? 'f59e0b' : 'ef4444'}]`}>
                      {status.text}
                    </span>
                  </div>
                  <h3 className="text-xl font-black uppercase text-[#1a2b4a] mb-2">PRACTICE HEALTH SUMMARY</h3>
                  <p className="text-[#1a2b4a] max-w-md font-bold">
                    {overallScore >= 80 
                      ? "EXCELLENT! YOUR PRACTICE DEMONSTRATES STRONG FOUNDATIONS ACROSS ALL AREAS."
                      : overallScore >= 60
                      ? "GOOD PROGRESS! FOCUS ON KEY IMPROVEMENT AREAS TO REACH EXCELLENCE."
                      : "SIGNIFICANT OPPORTUNITIES FOR IMPROVEMENT. PRIORITIZE CRITICAL AREAS FOR TRANSFORMATION."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sections.map((section, index) => {
              const score = calculateSectionScore(index);
              const sectionStatus = getScoreStatus(score);
              
              return (
                <div key={index} className="relative group">
                  <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
                  <div className="relative bg-white border-2 border-[#1a2b4a] p-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl mb-3">{section.icon}</div>
                      <h4 className="text-lg font-black uppercase text-[#1a2b4a] mb-2">{section.title}</h4>
                      <div className="mb-4">
                        <ProgressRing progress={score} size={80} strokeWidth={6} />
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <sectionStatus.icon className={`w-4 h-4 text-[#${sectionStatus.color === 'green' ? '10b981' : sectionStatus.color === 'amber' ? 'f59e0b' : 'ef4444'}]`} />
                        <span className={`text-sm font-black uppercase text-[#${sectionStatus.color === 'green' ? '10b981' : sectionStatus.color === 'amber' ? 'f59e0b' : 'ef4444'}]`}>
                          {sectionStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          <div className="relative group mb-8">
            <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
            <div className="relative bg-white border-2 border-[#1a2b4a] p-6 shadow-lg">
              <h3 className="text-xl font-black uppercase text-[#1a2b4a] mb-6">TOP PRIORITY RECOMMENDATIONS</h3>
              <div className="space-y-4">
                {generateRecommendations().map((rec, index) => (
                  <div key={index} className="bg-[#f5f1e8] border-2 border-[#1a2b4a] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#1a2b4a] font-black uppercase">{rec.action}</span>
                      <span className={`px-3 py-1 text-xs font-black uppercase border-2 ${
                        rec.priority === 'HIGH' 
                          ? 'bg-[#ef4444] text-white border-[#1a2b4a]' 
                          : 'bg-[#f59e0b] text-white border-[#1a2b4a]'
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                    </div>
                    <p className="text-[#1a2b4a] text-sm font-bold">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase transition-all duration-300 flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>DOWNLOAD FULL REPORT</span>
            </button>
            <button className="px-8 py-4 border-2 border-[#1a2b4a] text-[#1a2b4a] hover:bg-[#1a2b4a] hover:text-[#f5f1e8] font-black uppercase transition-all duration-300">
              BOOK FREE CONSULTATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a2b4a] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase text-[#f5f1e8] mb-2">
            {practiceName ? `${practiceName.toUpperCase()} HEALTH ASSESSMENT` : user ? `${user.email.toUpperCase()} HEALTH ASSESSMENT` : 'PRACTICE HEALTH ASSESSMENT'}
          </h1>
          <p className="text-xl text-[#f5f1e8] font-bold uppercase">
            COMPREHENSIVE EVALUATION OF YOUR PRACTICE ACROSS 6 KEY AREAS
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#f5f1e8] font-black uppercase text-lg">
              {sections[currentSection].icon} {sections[currentSection].title.toUpperCase()}
            </span>
            <span className="text-[#f5f1e8] font-bold uppercase">
              SECTION {currentSection + 1} OF {sections.length}
            </span>
          </div>
          <div className="h-3 bg-[#f5f1e8] border-2 border-[#1a2b4a] overflow-hidden">
            <div 
              className="h-full bg-[#ff6b35] transition-all duration-500"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
          <p className="text-[#f5f1e8] text-sm mt-2 font-bold uppercase">{sections[currentSection].description.toUpperCase()}</p>
        </div>

        {/* Questions */}
        <div className="relative group">
          <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
          <div className="relative bg-white border-2 border-[#1a2b4a] p-6 shadow-lg overflow-y-auto">
            <div className="space-y-6">
              {sections[currentSection].questions.map((question, qIndex) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: qIndex * 0.1 }}
                  className="border-b-2 border-[#1a2b4a] pb-6 last:border-b-0 last:pb-0"
                >
                  <h3 className="text-[#1a2b4a] font-black uppercase mb-4 text-lg leading-relaxed">
                    {qIndex + 1}. {question.text.toUpperCase()}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'yes', label: 'YES', color: 'green' },
                      { value: 'partial', label: 'PARTIALLY', color: 'amber' },
                      { value: 'no', label: 'NO', color: 'red' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(question.id, option.value)}
                        className={`
                          px-4 py-3 font-black uppercase transition-all duration-300 border-2
                          ${answers[question.id] === option.value
                            ? `bg-[#${option.color === 'green' ? '10b981' : option.color === 'amber' ? 'f59e0b' : 'ef4444'}] text-white border-[#1a2b4a]`
                            : 'bg-white text-[#1a2b4a] border-[#1a2b4a] hover:bg-[#ff6b35] hover:text-white hover:border-[#1a2b4a]'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Section Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                className="px-6 py-3 bg-[#f5f1e8] text-[#1a2b4a] border-2 border-[#1a2b4a] hover:bg-[#1a2b4a] hover:text-[#f5f1e8] font-black uppercase transition-all duration-300 disabled:opacity-50"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                PREVIOUS
              </button>
              <button
                className="px-6 py-3 bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase transition-all duration-300 disabled:opacity-50"
                onClick={nextSection}
                disabled={!isCurrentSectionComplete()}
              >
                {currentSection === sections.length - 1 ? 'FINISH' : 'NEXT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountancyHealth;
