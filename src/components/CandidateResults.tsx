import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@reelapps/auth';
import { Star, MapPin, Clock, ExternalLink, FileText, User } from 'lucide-react';
import { Button } from '@reelapps/ui';
import Card from './Card';
import styles from './CandidateResults.module.css';

interface Job {
  title: string;
  // other dynamic properties
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

const CandidateResults: React.FC<CandidateResultsProps> = ({ job }) => {
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'overall_score' | 'skills_match' | 'culture_match'>('overall_score');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [blindMode, setBlindMode] = useState(false);

  const supabase = getSupabaseClient();

  const fetchCandidateMatches = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-candidates', {
        body: { jobPosting: job },
      });

      if (error) {
        console.warn('Edge function error:', error);
        setMatches(generateMockMatches());
        return;
      }

      const parsed = MatchResponseSchema.safeParse(data);
      if (parsed.success) {
        setMatches(parsed.data);
      } else {
        console.warn('Invalid match response schema', parsed.error);
        setMatches(generateMockMatches());
      }
    } catch (err) {
      console.error('Failed to fetch candidate matches:', err);
      setMatches(generateMockMatches());
    } finally {
      setIsLoading(false);
    }
  }, [job]);

  useEffect(() => {
    fetchCandidateMatches();
  }, [fetchCandidateMatches]);

  const generateMockMatches = (): CandidateMatch[] => {
    return [
      {
        candidate_id: '1',
        overall_score: 92,
        skills_match: 95,
        culture_match: 88,
        experience_match: 93,
        reasoning: "Exceptional technical skills alignment, excellent experience level fit, strong cultural alignment.",
        strengths: ["React expertise", "Team leadership", "Problem solving"],
        concerns: ["Limited backend experience"],
        candidate: {
          id: '1',
          first_name: 'Sarah',
          last_name: 'Chen',
          headline: 'Senior Frontend Developer with 6+ years React experience',
          location: 'San Francisco, CA',
          availability: 'available',
          skills: [
            { name: 'React', proficiency: 'expert', years_experience: 6 },
            { name: 'TypeScript', proficiency: 'advanced', years_experience: 4 },
            { name: 'Node.js', proficiency: 'intermediate', years_experience: 3 }
          ]
        }
      },
      {
        candidate_id: '2',
        overall_score: 87,
        skills_match: 89,
        culture_match: 85,
        experience_match: 87,
        reasoning: "Strong technical skills alignment, good experience level, good cultural fit.",
        strengths: ["Full-stack capabilities", "Agile experience", "Communication skills"],
        concerns: ["Remote work preference", "Salary expectations"],
        candidate: {
          id: '2',
          first_name: 'Marcus',
          last_name: 'Johnson',
          headline: 'Full-Stack Developer passionate about user experience',
          location: 'Remote',
          availability: 'open',
          skills: [
            { name: 'React', proficiency: 'advanced', years_experience: 4 },
            { name: 'Python', proficiency: 'expert', years_experience: 5 },
            { name: 'AWS', proficiency: 'intermediate', years_experience: 2 }
          ]
        }
      },
      {
        candidate_id: '3',
        overall_score: 78,
        skills_match: 82,
        culture_match: 75,
        experience_match: 77,
        reasoning: "Good skills match with some gaps, adequate experience level, potential cultural fit concerns.",
        strengths: ["Quick learner", "Open source contributions", "Design skills"],
        concerns: ["Limited React experience", "Junior level"],
        candidate: {
          id: '3',
          first_name: 'Emily',
          last_name: 'Rodriguez',
          headline: 'Frontend Developer with strong design background',
          location: 'Austin, TX',
          availability: 'available',
          skills: [
            { name: 'Vue.js', proficiency: 'advanced', years_experience: 3 },
            { name: 'React', proficiency: 'intermediate', years_experience: 1 },
            { name: 'UI/UX Design', proficiency: 'expert', years_experience: 4 }
          ]
        }
      }
    ];
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'var(--accent-green)';
    if (score >= 70) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'var(--accent-green)';
      case 'open': return 'var(--accent-yellow)';
      default: return 'var(--text-muted)';
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
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Finding the best candidates for {job.title}...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>Candidate Matches for {job.title}</h2>
          <p>{filteredAndSortedMatches.length} candidates found</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.filters}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'overall_score' | 'skills_match' | 'culture_match')}
              className={styles.sortSelect}
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
              className={styles.filterInput}
            />
            
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Availability</option>
              <option value="available">Actively Looking</option>
              <option value="open">Open to Opportunities</option>
            </select>

            {/* Blind hiring toggle */}
            <label className={styles.blindToggle}>
              <input
                type="checkbox"
                checked={blindMode}
                onChange={(e) => setBlindMode(e.target.checked)}
              />
              Blind Mode
            </label>
          </div>
        </div>
      </div>

      <div className={styles.candidatesGrid}>
        {filteredAndSortedMatches.map((match) => (
          <Card key={match.candidate_id} className={styles.candidateCard}>
            <div className={styles.candidateHeader}>
              <div className={styles.candidateInfo}>
                {!blindMode && (
                  <div className={styles.candidateAvatar}>
                    {match.candidate.avatar_url ? (
                      <img 
                        src={match.candidate.avatar_url}
                        alt={`${match.candidate.first_name} ${match.candidate.last_name}`}
                        className={styles.candidateAvatarImg}
                      />
                    ) : (
                      <div className={styles.candidateAvatarPlaceholder}>
                        {match.candidate.first_name[0]}{match.candidate.last_name[0]}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h3 className={styles.candidateName}>
                    {blindMode ? 'Anonymous Candidate' : `${match.candidate.first_name} ${match.candidate.last_name}`}
                  </h3>
                  <p className={styles.candidateHeadline}>{match.candidate.headline}</p>
                  <div className={styles.candidateMeta}>
                    <span className={styles.location}>
                      <MapPin size={14} />
                      {match.candidate.location}
                    </span>
                    <span 
                      className={styles.availability}
                      style={{ color: getAvailabilityColor(match.candidate.availability) }}
                    >
                      {match.candidate.availability === 'available' ? 'Actively Looking' : 'Open to Opportunities'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.overallScore}>
                <div 
                  className={styles.scoreCircle}
                  style={{ 
                    '--score': match.overall_score,
                    '--color': getScoreColor(match.overall_score)
                  } as React.CSSProperties}
                >
                  <span className={styles.scoreText}>{match.overall_score}%</span>
                </div>
                <span className={styles.scoreLabel}>Match</span>
              </div>
            </div>

            <div className={styles.matchScores}>
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabel}>Skills</span>
                <div className={styles.scoreBar}>
                  <div 
                    className={styles.scoreBarFill}
                    style={{ 
                      width: `${match.skills_match}%`,
                      backgroundColor: getScoreColor(match.skills_match)
                    }}
                  />
                </div>
                <span className={styles.scoreValue}>{match.skills_match}%</span>
              </div>
              
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabel}>Culture</span>
                <div className={styles.scoreBar}>
                  <div 
                    className={styles.scoreBarFill}
                    style={{ 
                      width: `${match.culture_match}%`,
                      backgroundColor: getScoreColor(match.culture_match)
                    }}
                  />
                </div>
                <span className={styles.scoreValue}>{match.culture_match}%</span>
              </div>
              
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabel}>Experience</span>
                <div className={styles.scoreBar}>
                  <div 
                    className={styles.scoreBarFill}
                    style={{ 
                      width: `${match.experience_match}%`,
                      backgroundColor: getScoreColor(match.experience_match)
                    }}
                  />
                </div>
                <span className={styles.scoreValue}>{match.experience_match}%</span>
              </div>
            </div>

            <div className={styles.reasoning}>
              <p>{match.reasoning}</p>
            </div>

            <div className={styles.strengthsAndConcerns}>
              {match.strengths.length > 0 && (
                <div className={styles.strengths}>
                  <h4>Strengths</h4>
                  <div className={styles.tagList}>
                    {match.strengths.map((strength, index) => (
                      <span key={index} className={styles.strengthTag}>{strength}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {match.concerns.length > 0 && (
                <div className={styles.concerns}>
                  <h4>Considerations</h4>
                  <div className={styles.tagList}>
                    {match.concerns.map((concern, index) => (
                      <span key={index} className={styles.concernTag}>{concern}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.candidateActions}>
              {!blindMode && (
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => window.open(`https://www.reelcv.co.za/candidate/${match.candidate_id}`, '_blank')}
                >
                  <ExternalLink size={14} />
                  View ReelCV
                </Button>
              )}
              <Button size="small">
                Contact Candidate
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredAndSortedMatches.length === 0 && (
        <div className={styles.noResults}>
          <User size={64} className={styles.emptyIcon} />
          <h3>No candidates match your criteria</h3>
          <p>Try adjusting your filters or expanding your search parameters.</p>
        </div>
      )}
    </div>
  );
};

export default CandidateResults;