import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Card, ErrorBoundary } from '@reelapps/ui';
import { getSupabaseClient } from '@reelapps/auth';

interface JobPostingFormProps {
  onClose: () => void;
  onJobCreated: (job: any) => void;
}

interface JobAnalysis {
  clarity: number;
  realism: number;
  inclusivity: number;
  suggestions: string[];
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

  return (
    <div className={`p-4 rounded-lg border ${bgColor} mb-4`}>
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
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

const JobPostingForm: React.FC<JobPostingFormProps> = ({ onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: [''],
    location: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    remote_allowed: false,
    experience_level: 'mid',
    employment_type: 'full-time'
  });

  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    
    if (!formData.company.trim()) {
      errors.company = 'Company name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Job description must be at least 50 characters';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    const hasValidRequirement = formData.requirements.some(req => req.trim().length > 0);
    if (!hasValidRequirement) {
      errors.requirements = 'At least one requirement is needed';
    }
    
    if (formData.salary_min && formData.salary_max) {
      const min = parseInt(formData.salary_min);
      const max = parseInt(formData.salary_max);
      if (min >= max) {
        errors.salary = 'Maximum salary must be greater than minimum salary';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear analysis when form changes
    if (analysis) {
      setAnalysis(null);
      setShowAnalysis(false);
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    handleInputChange('requirements', newRequirements);
  };

  const addRequirement = () => {
    handleInputChange('requirements', [...formData.requirements, '']);
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const newRequirements = formData.requirements.filter((_, i) => i !== index);
      handleInputChange('requirements', newRequirements);
    }
  };

  const analyzeJobDescription = async () => {
    if (!validateForm()) {
      setError('Please fix the form errors before analyzing');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error: apiError } = await supabase.functions.invoke('analyze-job', {
        body: {
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements.filter(req => req.trim()),
          experience_level: formData.experience_level,
        },
      });

      if (apiError) {
        console.warn('Edge function error:', apiError);
        // Fallback mock analysis for demo
        setAnalysis({
          clarity: 75 + Math.random() * 25,
          realism: 70 + Math.random() * 30,
          inclusivity: 80 + Math.random() * 20,
          suggestions: [
            'Consider adding more specific technical requirements',
            'Include information about team size and structure',
            'Mention opportunities for professional development',
          ],
        });
      } else {
        setAnalysis(data as JobAnalysis);
      }
      setShowAnalysis(true);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze job posting');
      // Fallback mock analysis
      setAnalysis({
        clarity: 80,
        realism: 75,
        inclusivity: 88,
        suggestions: [
          "Review technical requirements for clarity",
          "Consider salary range transparency",
          "Add diversity and inclusion statement"
        ]
      });
      setShowAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the form errors before submitting');
      return;
    }
    
    setIsSaving(true);
    setError(null);

    try {
      // Simulate saving job posting
      const jobPosting: any = {
        id: Date.now().toString(),
        ...formData,
        requirements: formData.requirements.filter(req => req.trim()),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        ai_analysis_score: analysis,
        status: 'active',
        created_at: new Date().toISOString()
      };

      // In real implementation, save to Supabase
      console.log('Saving job posting:', jobPosting);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      onJobCreated(jobPosting);
    } catch (err) {
      console.error('Failed to save job posting:', err);
      setError(err instanceof Error ? err.message : 'Failed to save job posting');
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const canAnalyze = formData.title && formData.description && formData.requirements.some(req => req.trim());

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div 
          className="rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700/50"
          style={{ background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)' }}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Create Job Posting</h2>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Error Display */}
            {error && (
              <ErrorDisplay 
                error={error}
                onDismiss={() => setError(null)}
                type="error"
              />
            )}

            <div className="space-y-8">
              {/* Basic Information */}
              <div 
                className="rounded-lg p-6 border border-slate-700/50"
                style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)' }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior React Developer"
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        validationErrors.title ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    />
                    {validationErrors.title && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Company name"
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        validationErrors.company ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    />
                    {validationErrors.company && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.company}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={formData.experience_level}
                        onChange={(e) => handleInputChange('experience_level', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="entry">Entry Level</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                        <option value="principal">Principal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Employment Type
                      </label>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => handleInputChange('employment_type', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div 
                className="rounded-lg p-6 border border-slate-700/50"
                style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)' }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                  Job Description
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                      rows={6}
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                        validationErrors.description ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    />
                    {validationErrors.description && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Requirements *
                    </label>
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleRequirementChange(index, e.target.value)}
                          placeholder="e.g., 3+ years of React experience"
                          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRequirement(index)}
                            className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {validationErrors.requirements && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.requirements}</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={addRequirement}
                      className="mt-2"
                    >
                      Add Requirement
                    </Button>
                  </div>
                </div>
              </div>

              {/* Location & Compensation */}
              <div 
                className="rounded-lg p-6 border border-slate-700/50"
                style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)' }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                  Location & Compensation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., San Francisco, CA or Remote"
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        validationErrors.location ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    />
                    {validationErrors.location && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.remote_allowed}
                        onChange={(e) => handleInputChange('remote_allowed', e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                      />
                      Remote work allowed
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Min Salary
                      </label>
                      <input
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => handleInputChange('salary_min', e.target.value)}
                        placeholder="80000"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Max Salary
                      </label>
                      <input
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => handleInputChange('salary_max', e.target.value)}
                        placeholder="120000"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.salary_currency}
                        onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                  </div>
                  {validationErrors.salary && (
                    <p className="text-red-400 text-sm">{validationErrors.salary}</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            {showAnalysis && analysis && (
              <div className="mt-8">
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={20} className="text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">AI Job Analysis</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div 
                      className="text-center p-4 rounded-lg border border-slate-700/50"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)' }}
                    >
                      <div className="text-sm text-slate-400 mb-2">Clarity</div>
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.clarity)}`}>
                        {Math.round(analysis.clarity)}%
                      </div>
                    </div>
                    
                    <div 
                      className="text-center p-4 rounded-lg border border-slate-700/50"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)' }}
                    >
                      <div className="text-sm text-slate-400 mb-2">Realism</div>
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.realism)}`}>
                        {Math.round(analysis.realism)}%
                      </div>
                    </div>
                    
                    <div 
                      className="text-center p-4 rounded-lg border border-slate-700/50"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)' }}
                    >
                      <div className="text-sm text-slate-400 mb-2">Inclusivity</div>
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.inclusivity)}`}>
                        {Math.round(analysis.inclusivity)}%
                      </div>
                    </div>
                  </div>

                  {analysis.suggestions.length > 0 && (
                    <div 
                      className="rounded-lg p-4 border border-slate-700/50"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)' }}
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">Suggestions for Improvement:</h4>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={analyzeJobDescription}
                disabled={!canAnalyze || isAnalyzing}
                className="w-full sm:w-auto"
              >
                <Sparkles size={16} className="mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? 'Creating...' : 'Create Job Posting'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default JobPostingForm;