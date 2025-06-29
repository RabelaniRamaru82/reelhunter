import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Users, 
  Target, 
  Briefcase, 
  TrendingUp, 
  Brain, 
  Sparkles, 
  Eye, 
  Star, 
  Clock, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  Award, 
  BarChart3, 
  Zap, 
  Building, 
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuthStore } from '@reelapps/auth';
import JobPostingForm from './JobPostingForm';
import CandidateResults from './CandidateResults';
import { Button, Card, ErrorBoundary } from '@reelapps/ui';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  postedAt: string;
  applicants: number;
  matches: number;
  status: 'active' | 'paused' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  aiScore?: number;
}

interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  shortlisted: number;
  hired: number;
  avgTimeToHire: number;
  matchAccuracy: number;
  responseRate: number;
}

// Error display component
const ErrorDisplay: React.FC<{ 
  error: string; 
  onRetry?: () => void; 
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}> = ({ error, onRetry, onDismiss, type = 'error' }) => {
  const bgColor = {
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
  }[type];

  const icon = {
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle
  }[type];

  const Icon = icon;

  return (
    <div className={`p-4 rounded-lg border ${bgColor} mb-4`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm">{error}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  <X size={12} />
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  </div>
);

const ReelHunter: React.FC = () => {
  const { profile, error: authError, clearError } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'analytics' | 'pipeline'>('dashboard');
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [stats] = useState<RecruitmentStats>({
    totalJobs: 24,
    activeJobs: 18,
    totalApplicants: 347,
    shortlisted: 89,
    hired: 12,
    avgTimeToHire: 18,
    matchAccuracy: 89,
    responseRate: 76
  });

  const [jobPostings] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: { min: 120000, max: 160000, currency: 'USD' },
      description: 'We are looking for a senior React developer to join our growing team...',
      requirements: ['5+ years React experience', 'TypeScript proficiency', 'Team leadership'],
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      experience: 'Senior',
      postedAt: '2024-01-15',
      applicants: 45,
      matches: 12,
      status: 'active',
      priority: 'high',
      aiScore: 92
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'full-time',
      salary: { min: 90000, max: 130000, currency: 'USD' },
      description: 'Join our fast-paced startup as a full-stack engineer...',
      requirements: ['3+ years experience', 'Full-stack development', 'Startup experience'],
      skills: ['React', 'Python', 'PostgreSQL', 'Docker'],
      experience: 'Mid-level',
      postedAt: '2024-01-12',
      applicants: 67,
      matches: 23,
      status: 'active',
      priority: 'medium',
      aiScore: 85
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Austin, TX',
      type: 'full-time',
      salary: { min: 110000, max: 150000, currency: 'USD' },
      description: 'We need a DevOps engineer to scale our infrastructure...',
      requirements: ['AWS expertise', 'Kubernetes', 'CI/CD pipelines'],
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
      experience: 'Senior',
      postedAt: '2024-01-10',
      applicants: 28,
      matches: 8,
      status: 'paused',
      priority: 'low',
      aiScore: 78
    },
    {
      id: '4',
      title: 'Product Manager',
      company: 'InnovateLabs',
      location: 'New York, NY',
      type: 'full-time',
      salary: { min: 140000, max: 180000, currency: 'USD' },
      description: 'Lead product strategy and development for our AI platform...',
      requirements: ['5+ years PM experience', 'AI/ML background', 'Technical leadership'],
      skills: ['Product Strategy', 'AI/ML', 'Leadership', 'Analytics'],
      experience: 'Senior',
      postedAt: '2024-01-08',
      applicants: 34,
      matches: 15,
      status: 'active',
      priority: 'urgent',
      aiScore: 95
    }
  ]);

  // Initialize component with error handling
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check URL hash
        const hash = location.hash.replace('#', '');
        if (['dashboard', 'jobs', 'candidates', 'analytics', 'pipeline'].includes(hash)) {
          setActiveTab(hash as any);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize ReelHunter');
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [location.hash, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDismissError = () => {
    setError(null);
    if (authError) {
      clearError();
    }
  };

  const updateTab = (tab: typeof activeTab) => {
    try {
      setActiveTab(tab);
      navigate(`#${tab}`);
    } catch (err) {
      setError('Failed to navigate to tab');
    }
  };

  const handleJobCreated = (job: JobPosting) => {
    try {
      setShowJobForm(false);
      setSelectedJob(job);
      updateTab('candidates');
    } catch (err) {
      setError('Failed to process new job posting');
    }
  };

  // Check if user is a recruiter
  if (profile?.role !== 'recruiter') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center" style={{ 
          background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
          backgroundAttachment: 'fixed'
        }}>
          <div className="text-center max-w-md">
            <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">ReelHunter is exclusively for recruiters. Please contact support if you need access.</p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              Return to Home
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'closed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20';
      case 'paused': return 'bg-yellow-500/20';
      case 'closed': return 'bg-red-500/20';
      default: return 'bg-slate-500/20';
    }
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderJobCard = (job: JobPosting) => {
    return (
      <div
        key={job.id}
        className="group relative bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6 hover:border-slate-600/50 transition-all duration-300 hover:bg-slate-800/30 cursor-pointer"
        onClick={() => {
          try {
            setSelectedJob(job);
          } catch (err) {
            setError('Failed to select job posting');
          }
        }}
      >
        {/* Status Badge */}
        <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBg(job.status)}`}>
          <span className={getStatusColor(job.status)}>{job.status}</span>
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Building size={14} />
                <span>{job.company}</span>
                <span>•</span>
                <MapPin size={14} />
                <span>{job.location}</span>
              </div>
            </div>
            {job.aiScore && (
              <div className="text-right">
                <div className="text-lg font-bold text-purple-300">{job.aiScore}%</div>
                <div className="text-xs text-purple-400">AI Match</div>
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <DollarSign size={14} className="text-green-400" />
              <span>${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Briefcase size={14} className="text-blue-400" />
              <span className="capitalize">{job.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Users size={14} className="text-cyan-400" />
              <span>{job.applicants} applicants</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Target size={14} className="text-yellow-400" />
              <span>{job.matches} matches</span>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Posted {job.postedAt}</span>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>{job.experience}</span>
            </div>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center pb-4">
          <div className="flex gap-2">
            <Button size="small" variant="outline" className="bg-slate-800/80 backdrop-blur-sm border-slate-600/50">
              <Eye size={14} className="mr-1" />
              View Details
            </Button>
            <Button size="small" className="bg-blue-600/80 backdrop-blur-sm">
              <Users size={14} className="mr-1" />
              View Candidates
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <LoadingSpinner message="Loading ReelHunter..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="max-w-7xl mx-auto p-8">
          {/* Error Display */}
          {(error || authError) && (
            <ErrorDisplay 
              error={error || authError?.message || 'An error occurred'}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
              type={authError ? 'warning' : 'error'}
            />
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent mb-2">
                  ReelHunter
                </h1>
                <p className="text-slate-400 text-lg">
                  AI-powered recruitment platform for finding exceptional talent
                </p>
              </div>
              <button 
                onClick={() => {
                  try {
                    setShowJobForm(true);
                  } catch (err) {
                    setError('Failed to open job posting form');
                  }
                }}
                className="group relative px-6 py-3 font-semibold text-white transition-all duration-300 ease-out overflow-hidden rounded-lg bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50"
              >
                <div className="relative flex items-center gap-2 z-10">
                  <Plus size={16} />
                  Post New Job
                </div>
              </button>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              {[
                { icon: Briefcase, label: 'Total Jobs', value: stats.totalJobs, trend: TrendingUp },
                { icon: CheckCircle, label: 'Active', value: stats.activeJobs, trend: Zap },
                { icon: Users, label: 'Applicants', value: stats.totalApplicants, trend: ArrowUpRight },
                { icon: Star, label: 'Shortlisted', value: stats.shortlisted, trend: Target },
                { icon: Award, label: 'Hired', value: stats.hired, trend: CheckCircle },
                { icon: Clock, label: 'Days to Hire', value: stats.avgTimeToHire, trend: Calendar },
                { icon: Brain, label: 'AI Accuracy', value: `${stats.matchAccuracy}%`, trend: Sparkles },
                { icon: BarChart3, label: 'Response Rate', value: `${stats.responseRate}%`, trend: TrendingUp }
              ].map((stat, index) => {
                const Icon = stat.icon;
                const Trend = stat.trend;
                return (
                  <div 
                    key={index}
                    className="relative p-4 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer group bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 hover:bg-slate-800/30 hover:border-slate-600/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={20} className="text-slate-300" />
                      <Trend size={16} className="text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'jobs', label: 'Job Postings', icon: Briefcase },
              { key: 'candidates', label: 'Candidates', icon: Users },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
              { key: 'pipeline', label: 'Pipeline', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => updateTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-slate-700/50 text-white border border-slate-600/50 shadow-lg'
                      : 'bg-slate-800/20 text-slate-300 hover:bg-slate-700/30 border border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    icon: Plus, 
                    title: 'Post New Job', 
                    description: 'Create a new job posting',
                    action: () => setShowJobForm(true)
                  },
                  { 
                    icon: Users, 
                    title: 'Browse Candidates', 
                    description: 'Find top talent',
                    action: () => updateTab('candidates')
                  },
                  { 
                    icon: BarChart3, 
                    title: 'View Analytics', 
                    description: 'Track performance',
                    action: () => updateTab('analytics')
                  },
                  { 
                    icon: Target, 
                    title: 'Pipeline', 
                    description: 'Manage hiring flow',
                    action: () => updateTab('pipeline')
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        try {
                          item.action();
                        } catch (err) {
                          setError('Failed to perform action');
                        }
                      }}
                      className="relative p-6 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer group bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 hover:bg-slate-800/30 hover:border-slate-600/50"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Icon size={24} className="text-slate-300" />
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-sm">Get Started</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Jobs Preview */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Recent Job Postings</h2>
                  <Button 
                    variant="outline" 
                    onClick={() => updateTab('jobs')}
                    className="border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  >
                    View All Jobs
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobPostings.slice(0, 3).map(renderJobCard)}
                </div>
              </div>

              {/* AI Insights */}
              <div className="relative p-6 rounded-lg bg-slate-800/20 backdrop-blur-sm border border-slate-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <Brain size={24} className="text-slate-300" />
                  <h2 className="text-xl font-bold text-white">AI Recruitment Insights</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3">Market Trends</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        React developers are in high demand (+23% this month)
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        Remote positions receive 40% more applications
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3">Optimization Tips</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        Jobs with salary ranges get 2x more applications
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        Video job descriptions increase engagement by 60%
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3">Candidate Insights</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        Top candidates respond within 24 hours
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-500" />
                        Video portfolios increase hire probability by 3x
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  {['all', 'active', 'paused', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-3 rounded-lg whitespace-nowrap transition-all capitalize ${
                        filterStatus === status
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jobs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(renderJobCard)}
              </div>
            </div>
          )}

          {activeTab === 'candidates' && selectedJob && (
            <CandidateResults job={selectedJob} />
          )}

          {activeTab === 'candidates' && !selectedJob && (
            <div className="text-center py-16">
              <Search size={64} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select a Job to View Candidates</h3>
              <p className="text-slate-400 mb-6">Choose a job posting to see matched candidates and manage applications</p>
              <Button onClick={() => updateTab('jobs')} className="bg-blue-600 hover:bg-blue-700">
                Browse Job Postings
              </Button>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white">Recruitment Analytics</h2>
              
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Hiring Funnel</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Applications</span>
                      <span className="text-blue-300 font-bold">{stats.totalApplicants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shortlisted</span>
                      <span className="text-yellow-300 font-bold">{stats.shortlisted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Interviewed</span>
                      <span className="text-purple-300 font-bold">34</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hired</span>
                      <span className="text-green-300 font-bold">{stats.hired}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Time to Hire</span>
                      <span className="text-cyan-300 font-bold">{stats.avgTimeToHire} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Response Rate</span>
                      <span className="text-green-300 font-bold">{stats.responseRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Match Accuracy</span>
                      <span className="text-purple-300 font-bold">{stats.matchAccuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cost per Hire</span>
                      <span className="text-yellow-300 font-bold">$2,400</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Top Performing Jobs</h3>
                  <div className="space-y-3">
                    {jobPostings.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-slate-400">{job.applicants} applicants</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-300">{job.aiScore}%</div>
                          <div className="text-xs text-slate-400">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white">Hiring Pipeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { stage: 'Applied', count: 89, color: 'blue' },
                  { stage: 'Screening', count: 34, color: 'yellow' },
                  { stage: 'Interview', count: 12, color: 'purple' },
                  { stage: 'Offer', count: 5, color: 'green' }
                ].map((stage) => (
                  <div key={stage.stage} className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-2">{stage.stage}</h3>
                    <div className="text-3xl font-bold text-blue-300 mb-2">{stage.count}</div>
                    <p className="text-sm text-slate-400">candidates</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Posting Form Modal */}
          {showJobForm && (
            <JobPostingForm 
              onClose={() => setShowJobForm(false)}
              onJobCreated={handleJobCreated}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReelHunter;