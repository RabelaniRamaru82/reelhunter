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
  ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '@reelapps/auth';
import JobPostingForm from './JobPostingForm';
import CandidateResults from './CandidateResults';
import { Button, Card } from '@reelapps/ui';


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

const ReelHunter: React.FC = () => {
  const { profile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'analytics' | 'pipeline'>('dashboard');
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [_isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['dashboard', 'jobs', 'candidates', 'analytics', 'pipeline'].includes(hash)) {
      setActiveTab(hash as any);
    }
    setTimeout(() => setIsLoading(false), 1000);
  }, [location.hash]);

  const updateTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    navigate(`#${tab}`);
  };

  // Check if user is a recruiter
  if (profile?.role !== 'recruiter') {
    return (
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

  const __getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
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
        className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        onClick={() => setSelectedJob(job)}
      >
        {/* Priority Indicator */}
        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${__getPriorityColor(job.priority)}`} />

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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end justify-center pb-4">
          <div className="flex gap-2">
            <Button size="small" variant="outline" className="bg-slate-800/80 backdrop-blur-sm">
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

  return (
    <div className="min-h-screen" style={{ 
      background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-7xl mx-auto p-8">
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
              onClick={() => setShowJobForm(true)}
              className="group relative px-6 py-3 font-semibold text-white transition-all duration-300 ease-out overflow-hidden rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }}
            >
              <div className="relative flex items-center gap-2 z-10">
                <Plus size={16} />
                Post New Job
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>

          {/* Enhanced Stats Grid with Metallic 3D Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Briefcase size={20} className="text-white/90" />
                <TrendingUp size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalJobs}</div>
              <div className="text-sm text-white/70">Total Jobs</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={20} className="text-white/90" />
                <Zap size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeJobs}</div>
              <div className="text-sm text-white/70">Active</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Users size={20} className="text-white/90" />
                <ArrowUpRight size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalApplicants}</div>
              <div className="text-sm text-white/70">Applicants</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Star size={20} className="text-white/90" />
                <Target size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.shortlisted}</div>
              <div className="text-sm text-white/70">Shortlisted</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Award size={20} className="text-white/90" />
                <CheckCircle size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.hired}</div>
              <div className="text-sm text-white/70">Hired</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock size={20} className="text-white/90" />
                <Calendar size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.avgTimeToHire}</div>
              <div className="text-sm text-white/70">Days to Hire</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Brain size={20} className="text-white/90" />
                <Sparkles size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.matchAccuracy}%</div>
              <div className="text-sm text-white/70">AI Accuracy</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>

            <div 
              className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={20} className="text-white/90" />
                <TrendingUp size={16} className="text-white/70" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.responseRate}%</div>
              <div className="text-sm text-white/70">Response Rate</div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-white shadow-lg'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
                style={activeTab === tab.key ? {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                } : {}}
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
              <div
                onClick={() => setShowJobForm(true)}
                className="relative p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Plus size={24} className="text-white/90" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Post New Job</h3>
                    <p className="text-sm text-white/70">Create a new job posting</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-sm">Get Started</span>
                  <ChevronRight size={14} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>

              <div
                onClick={() => updateTab('candidates')}
                className="relative p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Users size={24} className="text-white/90" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Browse Candidates</h3>
                    <p className="text-sm text-white/70">Find top talent</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-sm">View Candidates</span>
                  <ChevronRight size={14} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>

              <div
                onClick={() => updateTab('analytics')}
                className="relative p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 size={24} className="text-white/90" />
                  <div>
                    <h3 className="text-lg font-bold text-white">View Analytics</h3>
                    <p className="text-sm text-white/70">Track performance</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-sm">View Reports</span>
                  <ChevronRight size={14} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>

              <div
                onClick={() => updateTab('pipeline')}
                className="relative p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Target size={24} className="text-white/90" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Pipeline</h3>
                    <p className="text-sm text-white/70">Manage hiring flow</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-sm">View Pipeline</span>
                  <ChevronRight size={14} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>
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
            <div 
              className="relative p-6 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain size={24} className="text-white/90" />
                <h2 className="text-xl font-bold text-white">AI Recruitment Insights</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-white/90 mb-3">Market Trends</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
                      React developers are in high demand (+23% this month)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
                      Remote positions receive 40% more applications
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white/90 mb-3">Optimization Tips</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
                      Jobs with salary ranges get 2x more applications
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
                      Video job descriptions increase engagement by 60%
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white/90 mb-3">Candidate Insights</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
                      Top candidates respond within 24 hours
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-white/80" />
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                {['all', 'active', 'paused', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-3 rounded-xl whitespace-nowrap transition-all capitalize ${
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
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
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

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
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

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
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
                <div key={stage.stage} className={`bg-gradient-to-br from-${stage.color}-800/30 to-${stage.color}-900/30 backdrop-blur-sm border border-${stage.color}-700/50 rounded-xl p-6`}>
                  <h3 className="text-lg font-bold text-white mb-2">{stage.stage}</h3>
                  <div className={`text-3xl font-bold text-${stage.color}-300 mb-2`}>{stage.count}</div>
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
            onJobCreated={(job: any) => {
              setShowJobForm(false);
              setSelectedJob(job);
              updateTab('candidates');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ReelHunter;
