/**
 * Community Discovery Service
 * 
 * Aggregates conferences, call for papers, and research opportunities
 * for meta-analysis and systematic review researchers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@meta_agent_community_discovery';
const INTERESTS_KEY = '@meta_agent_user_interests';

export type EventType = 'conference' | 'call_for_papers' | 'workshop' | 'webinar' | 'grant';
export type ResearchField = 
  | 'meta-analysis'
  | 'systematic-review'
  | 'evidence-synthesis'
  | 'cochrane'
  | 'epidemiology'
  | 'biostatistics'
  | 'health-technology-assessment'
  | 'clinical-trials'
  | 'network-meta-analysis'
  | 'individual-patient-data';

export interface ResearchEvent {
  id: string;
  title: string;
  type: EventType;
  description: string;
  organization: string;
  location: string;
  isVirtual: boolean;
  startDate: string;
  endDate?: string;
  deadline?: string;
  url: string;
  fields: ResearchField[];
  tags: string[];
  featured?: boolean;
}

export interface UserInterests {
  fields: ResearchField[];
  keywords: string[];
  organizations: string[];
  eventTypes: EventType[];
  notificationsEnabled: boolean;
}

export interface Researcher {
  id: string;
  displayName: string;
  institution?: string;
  fields: ResearchField[];
  bio?: string;
  publicationsCount?: number;
  joinedAt: number;
  isOnline?: boolean;
}

// Sample events data (in production, this would come from an API)
const SAMPLE_EVENTS: ResearchEvent[] = [
  {
    id: 'cochrane-2025',
    title: 'Cochrane Colloquium 2025',
    type: 'conference',
    description: 'The annual Cochrane Colloquium brings together systematic review authors, methodologists, and evidence users from around the world.',
    organization: 'Cochrane',
    location: 'London, UK',
    isVirtual: true,
    startDate: '2025-10-15',
    endDate: '2025-10-18',
    deadline: '2025-06-30',
    url: 'https://colloquium.cochrane.org',
    fields: ['systematic-review', 'cochrane', 'evidence-synthesis'],
    tags: ['cochrane', 'systematic review', 'evidence-based medicine'],
    featured: true,
  },
  {
    id: 'srsm-2025',
    title: 'Society for Research Synthesis Methodology Conference',
    type: 'conference',
    description: 'Annual meeting of SRSM focusing on advances in meta-analysis and research synthesis methodology.',
    organization: 'SRSM',
    location: 'Chicago, USA',
    isVirtual: false,
    startDate: '2025-07-20',
    endDate: '2025-07-22',
    deadline: '2025-04-15',
    url: 'https://www.srsm.org',
    fields: ['meta-analysis', 'evidence-synthesis', 'biostatistics'],
    tags: ['methodology', 'meta-analysis', 'research synthesis'],
    featured: true,
  },
  {
    id: 'cfp-res-synth-methods',
    title: 'Research Synthesis Methods - Special Issue on Network Meta-Analysis',
    type: 'call_for_papers',
    description: 'Call for papers for a special issue on advances in network meta-analysis methodology.',
    organization: 'Wiley',
    location: 'Online',
    isVirtual: true,
    startDate: '2025-01-01',
    deadline: '2025-05-31',
    url: 'https://onlinelibrary.wiley.com/journal/17592887',
    fields: ['network-meta-analysis', 'meta-analysis', 'biostatistics'],
    tags: ['journal', 'publication', 'network meta-analysis'],
  },
  {
    id: 'grade-workshop-2025',
    title: 'GRADE Workshop: From Evidence to Recommendations',
    type: 'workshop',
    description: 'Hands-on workshop on applying GRADE methodology for rating certainty of evidence.',
    organization: 'GRADE Working Group',
    location: 'Virtual',
    isVirtual: true,
    startDate: '2025-03-10',
    endDate: '2025-03-12',
    deadline: '2025-02-28',
    url: 'https://www.gradeworkinggroup.org',
    fields: ['evidence-synthesis', 'systematic-review', 'health-technology-assessment'],
    tags: ['GRADE', 'evidence quality', 'recommendations'],
  },
  {
    id: 'ipd-ma-webinar',
    title: 'Individual Patient Data Meta-Analysis: Methods and Applications',
    type: 'webinar',
    description: 'Free webinar on IPD-MA methodology, including one-stage and two-stage approaches.',
    organization: 'Cochrane Methods',
    location: 'Online',
    isVirtual: true,
    startDate: '2025-02-20',
    url: 'https://methods.cochrane.org',
    fields: ['individual-patient-data', 'meta-analysis', 'clinical-trials'],
    tags: ['IPD', 'webinar', 'free'],
  },
  {
    id: 'htai-2025',
    title: 'HTAi Annual Meeting 2025',
    type: 'conference',
    description: 'Health Technology Assessment international annual meeting.',
    organization: 'HTAi',
    location: 'Barcelona, Spain',
    isVirtual: true,
    startDate: '2025-06-14',
    endDate: '2025-06-18',
    deadline: '2025-02-28',
    url: 'https://htai.org',
    fields: ['health-technology-assessment', 'evidence-synthesis', 'systematic-review'],
    tags: ['HTA', 'policy', 'decision-making'],
  },
  {
    id: 'cfp-jce-sr',
    title: 'Journal of Clinical Epidemiology - Systematic Review Methods',
    type: 'call_for_papers',
    description: 'Ongoing call for methodological papers on systematic review innovations.',
    organization: 'Elsevier',
    location: 'Online',
    isVirtual: true,
    startDate: '2025-01-01',
    url: 'https://www.jclinepi.com',
    fields: ['systematic-review', 'epidemiology', 'meta-analysis'],
    tags: ['journal', 'methodology', 'publication'],
  },
  {
    id: 'cer-grant-2025',
    title: 'AHRQ Comparative Effectiveness Research Grant',
    type: 'grant',
    description: 'Funding opportunity for comparative effectiveness research including systematic reviews.',
    organization: 'AHRQ',
    location: 'USA',
    isVirtual: false,
    startDate: '2025-01-15',
    deadline: '2025-04-30',
    url: 'https://www.ahrq.gov',
    fields: ['evidence-synthesis', 'systematic-review', 'health-technology-assessment'],
    tags: ['funding', 'grant', 'USA'],
  },
];

class CommunityDiscoveryService {
  private events: ResearchEvent[] = [];
  private userInterests: UserInterests | null = null;
  private initialized = false;
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load cached events
      const eventsData = await AsyncStorage.getItem(STORAGE_KEY);
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      } else {
        this.events = SAMPLE_EVENTS;
        await this.saveEvents();
      }
      
      // Load user interests
      const interestsData = await AsyncStorage.getItem(INTERESTS_KEY);
      if (interestsData) {
        this.userInterests = JSON.parse(interestsData);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[CommunityDiscovery] Failed to initialize:', error);
      this.events = SAMPLE_EVENTS;
      this.initialized = true;
    }
  }
  
  /**
   * Save events to storage
   */
  private async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('[CommunityDiscovery] Failed to save events:', error);
    }
  }
  
  /**
   * Get all events
   */
  async getAllEvents(): Promise<ResearchEvent[]> {
    await this.initialize();
    return this.events.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }
  
  /**
   * Get events by type
   */
  async getEventsByType(type: EventType): Promise<ResearchEvent[]> {
    await this.initialize();
    return this.events
      .filter(e => e.type === type)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }
  
  /**
   * Get events by field
   */
  async getEventsByField(field: ResearchField): Promise<ResearchEvent[]> {
    await this.initialize();
    return this.events
      .filter(e => e.fields.includes(field))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }
  
  /**
   * Get featured events
   */
  async getFeaturedEvents(): Promise<ResearchEvent[]> {
    await this.initialize();
    return this.events.filter(e => e.featured);
  }
  
  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(daysAhead: number = 30): Promise<ResearchEvent[]> {
    await this.initialize();
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return this.events
      .filter(e => {
        if (!e.deadline) return false;
        const deadline = new Date(e.deadline);
        return deadline >= now && deadline <= futureDate;
      })
      .sort((a, b) => 
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      );
  }
  
  /**
   * Get personalized recommendations based on user interests
   */
  async getRecommendations(): Promise<ResearchEvent[]> {
    await this.initialize();
    
    if (!this.userInterests) {
      return this.getFeaturedEvents();
    }
    
    const scored = this.events.map(event => {
      let score = 0;
      
      // Field match
      for (const field of event.fields) {
        if (this.userInterests!.fields.includes(field)) {
          score += 10;
        }
      }
      
      // Event type preference
      if (this.userInterests!.eventTypes.includes(event.type)) {
        score += 5;
      }
      
      // Keyword match
      for (const keyword of this.userInterests!.keywords) {
        if (
          event.title.toLowerCase().includes(keyword.toLowerCase()) ||
          event.description.toLowerCase().includes(keyword.toLowerCase()) ||
          event.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
        ) {
          score += 3;
        }
      }
      
      // Organization preference
      if (this.userInterests!.organizations.includes(event.organization)) {
        score += 5;
      }
      
      // Featured bonus
      if (event.featured) {
        score += 2;
      }
      
      return { event, score };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.event);
  }
  
  /**
   * Search events
   */
  async searchEvents(query: string): Promise<ResearchEvent[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    
    return this.events.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.organization.toLowerCase().includes(lowerQuery) ||
      event.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      event.fields.some(f => f.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * Set user interests
   */
  async setUserInterests(interests: UserInterests): Promise<void> {
    this.userInterests = interests;
    try {
      await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
    } catch (error) {
      console.error('[CommunityDiscovery] Failed to save interests:', error);
    }
  }
  
  /**
   * Get user interests
   */
  async getUserInterests(): Promise<UserInterests | null> {
    await this.initialize();
    return this.userInterests;
  }
  
  /**
   * Get available fields
   */
  getAvailableFields(): ResearchField[] {
    return [
      'meta-analysis',
      'systematic-review',
      'evidence-synthesis',
      'cochrane',
      'epidemiology',
      'biostatistics',
      'health-technology-assessment',
      'clinical-trials',
      'network-meta-analysis',
      'individual-patient-data',
    ];
  }
  
  /**
   * Get field display name
   */
  getFieldDisplayName(field: ResearchField): string {
    const names: Record<ResearchField, string> = {
      'meta-analysis': 'Meta-Analysis',
      'systematic-review': 'Systematic Review',
      'evidence-synthesis': 'Evidence Synthesis',
      'cochrane': 'Cochrane',
      'epidemiology': 'Epidemiology',
      'biostatistics': 'Biostatistics',
      'health-technology-assessment': 'Health Technology Assessment',
      'clinical-trials': 'Clinical Trials',
      'network-meta-analysis': 'Network Meta-Analysis',
      'individual-patient-data': 'Individual Patient Data',
    };
    return names[field] || field;
  }
  
  /**
   * Get event type icon
   */
  getEventTypeIcon(type: EventType): string {
    const icons: Record<EventType, string> = {
      conference: '🎤',
      call_for_papers: '📝',
      workshop: '🔧',
      webinar: '💻',
      grant: '💰',
    };
    return icons[type] || '📅';
  }
  
  /**
   * Get event type display name
   */
  getEventTypeDisplayName(type: EventType): string {
    const names: Record<EventType, string> = {
      conference: 'Conference',
      call_for_papers: 'Call for Papers',
      workshop: 'Workshop',
      webinar: 'Webinar',
      grant: 'Grant/Funding',
    };
    return names[type] || type;
  }
}

// Export singleton
export const communityDiscoveryService = new CommunityDiscoveryService();

// Export convenience functions
export const getAllEvents = () => communityDiscoveryService.getAllEvents();
export const getEventsByType = (type: EventType) => communityDiscoveryService.getEventsByType(type);
export const getEventsByField = (field: ResearchField) => communityDiscoveryService.getEventsByField(field);
export const getFeaturedEvents = () => communityDiscoveryService.getFeaturedEvents();
export const getUpcomingDeadlines = (days?: number) => communityDiscoveryService.getUpcomingDeadlines(days);
export const getRecommendations = () => communityDiscoveryService.getRecommendations();
export const searchEvents = (query: string) => communityDiscoveryService.searchEvents(query);
export const setUserInterests = (interests: UserInterests) => communityDiscoveryService.setUserInterests(interests);
export const getUserInterests = () => communityDiscoveryService.getUserInterests();
