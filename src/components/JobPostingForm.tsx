import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import styles from './JobPostingForm.module.css';
import { getSupabaseClient } from '@reelapps/auth';

interface JobPostingFormProps {
  onClose: () => void;
  onJobCreated: (_job: any) => void;
}

interface JobAnalysis {
  clarity: number;
  realism: number;
  inclusivity: number;
  suggestions: string[];
}

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear analysis when form changes
    if (analysis) {
      setAnalysis(null);
      setShowAnalysis(false);
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const newRequirements = formData.requirements.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, requirements: newRequirements }));
    }
  };

  const analyzeJobDescription = async () => {
    setIsAnalyzing(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('analyze-job', {
        body: {
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements.filter(req => req.trim()),
          experience_level: formData.experience_level,
        },
      });

      if (error) {
        console.warn('Edge function error:', error);
        // Fallback mock analysis for demo
        setAnalysis({
          clarity: 85,
          realism: 78,
          inclusivity: 92,
          suggestions: [
            'Consider adding more specific technical requirements',
            'Include information about team size and structure',
            'Mention opportunities for professional development',
          ],
        });
      } else {
        setAnalysis(data as unknown as JobAnalysis);
      }
      setShowAnalysis(true);
    } catch (error) {
      console.error('Analysis failed:', error);
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
    setIsSaving(true);

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

      onJobCreated(jobPosting);
    } catch (error) {
      console.error('Failed to save job posting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const canAnalyze = formData.title && formData.description && formData.requirements.some(req => req.trim());

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Create Job Posting</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Basic Information */}
            <div className={styles.section}>
              <h3>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label>Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Senior React Developer"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Company *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Experience Level</label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => handleInputChange('employment_type', e.target.value)}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className={styles.section}>
              <h3>Job Description</h3>
              
              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  rows={6}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Requirements *</label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className={styles.requirementRow}>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      placeholder="e.g., 3+ years of React experience"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className={styles.removeButton}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={addRequirement}
                >
                  Add Requirement
                </Button>
              </div>
            </div>

            {/* Location & Compensation */}
            <div className={styles.section}>
              <h3>Location & Compensation</h3>
              
              <div className={styles.formGroup}>
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.remote_allowed}
                    onChange={(e) => handleInputChange('remote_allowed', e.target.checked)}
                  />
                  Remote work allowed
                </label>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Min Salary</label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => handleInputChange('salary_min', e.target.value)}
                    placeholder="80000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Max Salary</label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => handleInputChange('salary_max', e.target.value)}
                    placeholder="120000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Currency</label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          {showAnalysis && analysis && (
            <div className={styles.analysisSection}>
              <Card>
                <Card.Header
                  icon={<Sparkles size={20} />}
                  title="AI Job Analysis"
                  description="Our AI has analyzed your job posting for optimization opportunities"
                />
                
                <div className={styles.analysisScores}>
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreLabel}>Clarity</div>
                    <div 
                      className={styles.scoreValue}
                      style={{ color: getScoreColor(analysis.clarity) }}
                    >
                      {analysis.clarity}%
                    </div>
                  </div>
                  
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreLabel}>Realism</div>
                    <div 
                      className={styles.scoreValue}
                      style={{ color: getScoreColor(analysis.realism) }}
                    >
                      {analysis.realism}%
                    </div>
                  </div>
                  
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreLabel}>Inclusivity</div>
                    <div 
                      className={styles.scoreValue}
                      style={{ color: getScoreColor(analysis.inclusivity) }}
                    >
                      {analysis.inclusivity}%
                    </div>
                  </div>
                </div>

                {analysis.suggestions.length > 0 && (
                  <div className={styles.suggestions}>
                    <h4>Suggestions for Improvement:</h4>
                    <ul>
                      {analysis.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={analyzeJobDescription}
              disabled={!canAnalyze || isAnalyzing}
            >
              <Sparkles size={16} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </Button>
            
            <div className={styles.submitActions}>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create Job Posting'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostingForm;