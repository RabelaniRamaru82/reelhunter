import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@reelapps/auth';
import { Star, MapPin, Clock, ExternalLink, User, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button, Card, ErrorBoundary } from '@reelapps/ui';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  [key: string]: unknown;
}

interface CandidateResultsProps {
  job: Job;
}

interface CandidateMatch {
  candidate_id: string;
  overall_score: number;
  skills_match: number;
  culture_match: number;
  experience_match: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    headline: string;
    location: string;
    availability: string;
    skills: unknown[];
    avatar_url?: string | null;
  };
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

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  </div>
);

const CandidateResults: React.FC<CandidateResultsProps> = ({ job }) => {
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sortBy, setSortBy] = useState<'overall_score' | 'skills_match' | 'culture_match'>('overall_score');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [blindMode, setBlindMode] = useState(false);

  const supabase = getSupabaseClient();

  const fetchCandidateMatches = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching candidate matches for job:', job.id);
      
      const { data, error: apiError } = await supabase.functions.invoke('match-candidates', {
        body: { 
          job_id: job.id,
          job_title: job.title,
          job_description: job.description,
          job_requirements: job.requirements,
          job_skills: job.skills,
          experience_level: job.experience
        },
      });

      if (apiError) {
        console.error('Edge function error:', apiError);
        throw new Error(`AI matching service error: ${apiError.message}`);
      }

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from AI matching service');
      }

      console.log('Successfully fetched candidate matches:', data.length);
      setMatches(data);
      
    } catch (err) {
      console.error('Failed to fetch candidate matches:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch candidates';
      setError(errorMessage);
      
      // Don't set empty matches on error - let user retry
      if (matches.length === 0) {
        setMatches([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [job, supabase, matches.length]);

  useEffect(() => {
    fetchCandidateMatches();
  }, [fetchCandidateMatches, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDismissError = () => {
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreColorBg = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400';
      case 'open': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const filteredAndSortedMatches = matches
    .filter(match => {
      if (filterLocation && !match.candidate.location.toLowerCase().includes(filterLocation.toLowerCase())) {
        return false;
      }
      if (filterAvailability && match.candidate.availability !== filterAvailability) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-6">
          <LoadingSpinner message={`AI is analyzing candidates for ${job.title}...`} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            type="error"
          />
        )}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">AI-Matched Candidates for {job.title}</h2>
              <p className="text-slate-400">{filteredAndSortedMatches.length} candidates found</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'overall_score' | 'skills_match' | 'culture_match')}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="overall_score">Overall Score</option>
                <option value="skills_match">Skills Match</option>
                <option value="culture_match">Culture Match</option>
              </select>
              
              <input
                type="text"
                placeholder="Filter by location..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Availability</option>
                <option value="available">Actively Looking</option>
                <option value="open">Open to Opportunities</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={blindMode}
                  onChange={(e) => setBlindMode(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Blind Mode
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedMatches.map((match) => (
              <Card key={match.candidate_id} className="hover:scale-105 transition-transform duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {!blindMode && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {match.candidate.avatar_url ? (
                          <img 
                            src={match.candidate.avatar_url}
                            alt={`${match.candidate.first_name} ${match.candidate.last_name}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          `${match.candidate.first_name[0]}${match.candidate.last_name[0]}`
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {blindMode ? 'Anonymous Candidate' : `${match.candidate.first_name} ${match.candidate.last_name}`}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">{match.candidate.headline}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {match.candidate.location}
                        </span>
                        <span 
                          className={`flex items-center gap-1 ${getAvailabilityColor(match.candidate.availability)}`}
                        >
                          <Clock size={12} />
                          {match.candidate.availability === 'available' ? 'Actively Looking' : 'Open to Opportunities'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1"
                      style={{ 
                        background: `conic-gradient(${getScoreColorBg(match.overall_score)} 0deg, ${getScoreColorBg(match.overall_score)} ${match.overall_score * 3.6}deg, #334155 ${match.overall_score * 3.6}deg)`
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        {match.overall_score}%
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">Match</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    { label: 'Skills', value: match.skills_match },
                    { label: 'Culture', value: match.culture_match },
                    { label: 'Experience', value: match.experience_match }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-16">{item.label}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: getScoreColorBg(item.value)
                          }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${getScoreColor(item.value)}`}>
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{match.reasoning}</p>
                </div>

                <div className="space-y-3 mb-4">
                  {match.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.strengths.map((strength, index) => (
                          <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {match.concerns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">Considerations</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.concerns.map((concern, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!blindMode && (
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => {
                        try {
                          window.open(`https://www.reelcv.co.za/candidate/${match.candidate_id}`, '_blank');
                        } catch (err) {
                          console.error('Failed to open ReelCV profile:', err);
                        }
                      }}
                      className="flex-1"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View ReelCV
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    className="flex-1"
                    onClick={() => {
                      try {
                        // In a real app, this would open a contact modal or send a message
                        console.log('Contacting candidate:', match.candidate_id);
                      } catch (err) {
                        console.error('Failed to contact candidate:', err);
                      }
                    }}
                  >
                    Contact Candidate
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredAndSortedMatches.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <User size={64} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No candidates match your criteria</h3>
              <p className="text-slate-400 mb-6">Try adjusting your filters or expanding your search parameters.</p>
              <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw size={16} className="mr-2" />
                Refresh Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CandidateResults;