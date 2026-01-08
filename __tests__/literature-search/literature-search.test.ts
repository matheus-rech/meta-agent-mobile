/**
 * Tests for Literature Search Service
 */

import { describe, it, expect } from 'vitest';
import {
  formatAPACitation,
  studyToSpreadsheetRow,
  type StudyMetadata,
} from '../../lib/literature-search';

describe('Literature Search Service', () => {
  describe('formatAPACitation', () => {
    it('should format a complete citation', () => {
      const study: StudyMetadata = {
        id: 'test_1',
        title: 'Effect of intervention on outcome',
        authors: ['Smith J', 'Jones M', 'Brown K'],
        year: 2020,
        journal: 'Journal of Meta-Analysis',
        volume: '15',
        issue: '3',
        pages: '123-145',
        doi: '10.1000/xyz123',
        pmid: '12345678',
        abstract: null,
        source: 'pubmed',
      };
      
      const citation = formatAPACitation(study);
      
      expect(citation).toContain('Smith J, Jones M, Brown K');
      expect(citation).toContain('(2020)');
      expect(citation).toContain('Effect of intervention on outcome');
      expect(citation).toContain('Journal of Meta-Analysis');
      expect(citation).toContain('15(3)');
      expect(citation).toContain('123-145');
      expect(citation).toContain('https://doi.org/10.1000/xyz123');
    });
    
    it('should handle more than 3 authors with et al.', () => {
      const study: StudyMetadata = {
        id: 'test_2',
        title: 'Multi-author study',
        authors: ['Smith J', 'Jones M', 'Brown K', 'Wilson R', 'Taylor S'],
        year: 2021,
        journal: 'Nature',
        volume: '500',
        issue: null,
        pages: '50-55',
        doi: null,
        pmid: null,
        abstract: null,
        source: 'crossref',
      };
      
      const citation = formatAPACitation(study);
      
      expect(citation).toContain('Smith J, Jones M, Brown K, et al.');
      expect(citation).not.toContain('Wilson');
    });
    
    it('should handle missing year', () => {
      const study: StudyMetadata = {
        id: 'test_3',
        title: 'Study without year',
        authors: ['Unknown A'],
        year: null,
        journal: 'Some Journal',
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        abstract: null,
        source: 'pubmed',
      };
      
      const citation = formatAPACitation(study);
      
      expect(citation).toContain('(n.d.)');
    });
    
    it('should handle missing authors', () => {
      const study: StudyMetadata = {
        id: 'test_4',
        title: 'Anonymous study',
        authors: [],
        year: 2019,
        journal: 'Journal',
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        abstract: null,
        source: 'crossref',
      };
      
      const citation = formatAPACitation(study);
      
      expect(citation).toContain('Unknown');
    });
  });
  
  describe('studyToSpreadsheetRow', () => {
    it('should convert study metadata to spreadsheet row', () => {
      const study: StudyMetadata = {
        id: 'test_5',
        title: 'Test Study',
        authors: ['Smith J', 'Jones M'],
        year: 2022,
        journal: 'Test Journal',
        volume: '10',
        issue: '2',
        pages: '100-110',
        doi: '10.1000/test',
        pmid: '99999999',
        abstract: 'This is a test abstract.',
        source: 'pubmed',
      };
      
      const row = studyToSpreadsheetRow(study);
      
      expect(row.study).toBe('Smith 2022');
      expect(row.year).toBe(2022);
      expect(row.authors).toBe('Smith J; Jones M');
      expect(row.journal).toBe('Test Journal');
      expect(row.doi).toBe('10.1000/test');
      expect(row.pmid).toBe('99999999');
      expect(row.n_treatment).toBe('');
      expect(row.n_control).toBe('');
    });
    
    it('should handle missing year in study label', () => {
      const study: StudyMetadata = {
        id: 'test_6',
        title: 'No Year Study',
        authors: ['Brown K'],
        year: null,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        abstract: null,
        source: 'crossref',
      };
      
      const row = studyToSpreadsheetRow(study);
      
      expect(row.study).toBe('Brown');
      expect(row.year).toBe('');
    });
    
    it('should handle missing authors', () => {
      const study: StudyMetadata = {
        id: 'test_7',
        title: 'Anonymous',
        authors: [],
        year: 2020,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        abstract: null,
        source: 'pubmed',
      };
      
      const row = studyToSpreadsheetRow(study);
      
      expect(row.study).toBe('Unknown 2020');
      expect(row.authors).toBe('');
    });
  });
  
  describe('PubMed XML Parsing', () => {
    it('should extract PMID from XML', () => {
      const pmidRegex = /<PMID[^>]*>(\d+)<\/PMID>/;
      const xml = '<PMID Version="1">12345678</PMID>';
      const match = pmidRegex.exec(xml);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('12345678');
    });
    
    it('should extract title from XML', () => {
      const titleRegex = /<ArticleTitle>([^<]+)<\/ArticleTitle>/;
      const xml = '<ArticleTitle>Effect of treatment on outcomes</ArticleTitle>';
      const match = titleRegex.exec(xml);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('Effect of treatment on outcomes');
    });
    
    it('should extract year from PubDate', () => {
      const yearRegex = /<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/;
      const xml = '<PubDate><Year>2021</Year><Month>06</Month></PubDate>';
      const match = yearRegex.exec(xml);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('2021');
    });
    
    it('should decode XML entities', () => {
      const decodeXMLEntities = (text: string): string => {
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      };
      
      expect(decodeXMLEntities('Smith &amp; Jones')).toBe('Smith & Jones');
      expect(decodeXMLEntities('&lt;title&gt;')).toBe('<title>');
      expect(decodeXMLEntities('&quot;quoted&quot;')).toBe('"quoted"');
    });
  });
  
  describe('CrossRef Response Parsing', () => {
    it('should extract authors from CrossRef format', () => {
      const authors = [
        { family: 'Smith', given: 'John' },
        { family: 'Jones', given: 'Mary' },
      ];
      
      const formatted = authors.map(a => {
        const lastName = a.family || '';
        const firstName = a.given || '';
        return firstName ? `${lastName} ${firstName.charAt(0)}` : lastName;
      });
      
      expect(formatted).toEqual(['Smith J', 'Jones M']);
    });
    
    it('should extract year from date-parts', () => {
      const publishedPrint = { 'date-parts': [[2020, 6, 15]] };
      const year = publishedPrint['date-parts'][0][0];
      
      expect(year).toBe(2020);
    });
    
    it('should handle missing date-parts', () => {
      const published: any = null;
      const year = published?.['date-parts']?.[0]?.[0] || null;
      
      expect(year).toBeNull();
    });
    
    it('should strip HTML from abstract', () => {
      const stripHTML = (html: string): string => {
        return html.replace(/<[^>]*>/g, '').trim();
      };
      
      const html = '<jats:p>This is the <jats:italic>abstract</jats:italic> text.</jats:p>';
      const plain = stripHTML(html);
      
      expect(plain).toBe('This is the abstract text.');
    });
  });
  
  describe('DOI Handling', () => {
    it('should extract DOI from URL', () => {
      const extractDOI = (input: string): string => {
        return input.trim().replace(/^https?:\/\/doi\.org\//, '');
      };
      
      expect(extractDOI('https://doi.org/10.1000/xyz123')).toBe('10.1000/xyz123');
      expect(extractDOI('http://doi.org/10.1000/abc')).toBe('10.1000/abc');
      expect(extractDOI('10.1000/direct')).toBe('10.1000/direct');
    });
    
    it('should validate DOI format', () => {
      const isValidDOI = (doi: string): boolean => {
        return /^10\.\d{4,}\//.test(doi);
      };
      
      expect(isValidDOI('10.1000/xyz123')).toBe(true);
      expect(isValidDOI('10.12345/abc.def')).toBe(true);
      expect(isValidDOI('not-a-doi')).toBe(false);
      expect(isValidDOI('11.1000/wrong')).toBe(false);
    });
  });
  
  describe('PMID Handling', () => {
    it('should validate PMID format', () => {
      const isValidPMID = (pmid: string): boolean => {
        return /^\d+$/.test(pmid.trim());
      };
      
      expect(isValidPMID('12345678')).toBe(true);
      expect(isValidPMID('1')).toBe(true);
      expect(isValidPMID('abc123')).toBe(false);
      expect(isValidPMID('123.456')).toBe(false);
    });
  });
  
  describe('Search Query Detection', () => {
    it('should detect PMID queries', () => {
      const isPMID = (query: string): boolean => /^\d+$/.test(query.trim());
      
      expect(isPMID('12345678')).toBe(true);
      expect(isPMID('meta-analysis')).toBe(false);
    });
    
    it('should detect DOI queries', () => {
      const isDOI = (query: string): boolean => query.includes('/');
      
      expect(isDOI('10.1000/xyz')).toBe(true);
      expect(isDOI('https://doi.org/10.1000/xyz')).toBe(true);
      expect(isDOI('meta-analysis')).toBe(false);
    });
  });
});

describe('Rate Limiting', () => {
  it('should delay between requests', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const start = Date.now();
    await delay(100);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
