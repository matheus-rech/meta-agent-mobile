/**
 * Literature Search Service
 * 
 * Integrates with PubMed (NCBI E-utilities) and CrossRef REST API
 * for searching and retrieving study metadata.
 */

import axios from 'axios';

export interface StudyMetadata {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  pmid: string | null;
  abstract: string | null;
  source: 'pubmed' | 'crossref';
  sampleSize?: number;
  studyType?: string;
}

// PubMed E-utilities base URL
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const CROSSREF_BASE = 'https://api.crossref.org';

// Rate limiting - PubMed allows 3 requests/second without API key
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search PubMed for studies
 */
export async function searchPubMed(
  query: string,
  searchType: 'query' | 'pmid' = 'query',
  maxResults: number = 20
): Promise<StudyMetadata[]> {
  try {
    let pmids: string[] = [];
    
    if (searchType === 'pmid') {
      // Direct PMID lookup
      pmids = [query.trim()];
    } else {
      // Search for PMIDs using esearch
      const searchUrl = `${PUBMED_BASE}/esearch.fcgi`;
      const searchParams = {
        db: 'pubmed',
        term: query,
        retmax: maxResults.toString(),
        retmode: 'json',
      };
      
      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      pmids = searchResponse.data?.esearchresult?.idlist || [];
    }
    
    if (pmids.length === 0) {
      return [];
    }
    
    // Fetch details using efetch
    await delay(350); // Rate limiting
    
    const fetchUrl = `${PUBMED_BASE}/efetch.fcgi`;
    const fetchParams = {
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      rettype: 'abstract',
    };
    
    const fetchResponse = await axios.get(fetchUrl, { params: fetchParams });
    const xmlData = fetchResponse.data;
    
    // Parse XML response
    return parsePubMedXML(xmlData);
  } catch (error) {
    console.error('[PubMed] Search error:', error);
    throw new Error('Failed to search PubMed');
  }
}

/**
 * Parse PubMed XML response
 */
function parsePubMedXML(xml: string): StudyMetadata[] {
  const results: StudyMetadata[] = [];
  
  // Simple regex-based parsing (for production, use a proper XML parser)
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match;
  
  while ((match = articleRegex.exec(xml)) !== null) {
    const article = match[1];
    
    // Extract PMID
    const pmidMatch = article.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const pmid = pmidMatch ? pmidMatch[1] : null;
    
    // Extract title
    const titleMatch = article.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
    const title = titleMatch ? decodeXMLEntities(titleMatch[1]) : 'Unknown Title';
    
    // Extract authors
    const authors: string[] = [];
    const authorRegex = /<Author[^>]*>[\s\S]*?<LastName>([^<]+)<\/LastName>[\s\S]*?<ForeName>([^<]*)<\/ForeName>[\s\S]*?<\/Author>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(article)) !== null) {
      const lastName = authorMatch[1];
      const foreName = authorMatch[2];
      authors.push(`${lastName} ${foreName.charAt(0)}`);
    }
    
    // Extract year
    const yearMatch = article.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
    
    // Extract journal
    const journalMatch = article.match(/<Title>([^<]+)<\/Title>/);
    const journal = journalMatch ? decodeXMLEntities(journalMatch[1]) : null;
    
    // Extract volume/issue/pages
    const volumeMatch = article.match(/<Volume>([^<]+)<\/Volume>/);
    const issueMatch = article.match(/<Issue>([^<]+)<\/Issue>/);
    const pagesMatch = article.match(/<MedlinePgn>([^<]+)<\/MedlinePgn>/);
    
    // Extract DOI
    const doiMatch = article.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
    const doi = doiMatch ? doiMatch[1] : null;
    
    // Extract abstract
    const abstractMatch = article.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
    const abstract = abstractMatch ? decodeXMLEntities(abstractMatch[1]) : null;
    
    results.push({
      id: `pubmed_${pmid || Date.now()}`,
      title,
      authors,
      year,
      journal,
      volume: volumeMatch ? volumeMatch[1] : null,
      issue: issueMatch ? issueMatch[1] : null,
      pages: pagesMatch ? pagesMatch[1] : null,
      doi,
      pmid,
      abstract,
      source: 'pubmed',
    });
  }
  
  return results;
}

/**
 * Search CrossRef for studies
 */
export async function searchCrossRef(
  query: string,
  searchType: 'query' | 'doi' = 'query',
  maxResults: number = 20
): Promise<StudyMetadata[]> {
  try {
    if (searchType === 'doi') {
      // Direct DOI lookup
      const doi = query.trim().replace(/^https?:\/\/doi\.org\//, '');
      const url = `${CROSSREF_BASE}/works/${encodeURIComponent(doi)}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MetaAgentMobile/1.0 (mailto:support@example.com)',
        },
      });
      
      const work = response.data?.message;
      if (!work) return [];
      
      return [parseCrossRefWork(work)];
    } else {
      // Search query
      const url = `${CROSSREF_BASE}/works`;
      const params = {
        query: query,
        rows: maxResults.toString(),
        filter: 'type:journal-article',
        select: 'DOI,title,author,published-print,published-online,container-title,volume,issue,page,abstract',
      };
      
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': 'MetaAgentMobile/1.0 (mailto:support@example.com)',
        },
      });
      
      const items = response.data?.message?.items || [];
      return items.map(parseCrossRefWork);
    }
  } catch (error) {
    console.error('[CrossRef] Search error:', error);
    throw new Error('Failed to search CrossRef');
  }
}

/**
 * Parse CrossRef work object
 */
function parseCrossRefWork(work: any): StudyMetadata {
  // Extract authors
  const authors = (work.author || []).map((a: any) => {
    const lastName = a.family || '';
    const firstName = a.given || '';
    return firstName ? `${lastName} ${firstName.charAt(0)}` : lastName;
  });
  
  // Extract year
  const publishedPrint = work['published-print']?.['date-parts']?.[0];
  const publishedOnline = work['published-online']?.['date-parts']?.[0];
  const dateParts = publishedPrint || publishedOnline;
  const year = dateParts ? dateParts[0] : null;
  
  // Extract title
  const title = Array.isArray(work.title) ? work.title[0] : work.title || 'Unknown Title';
  
  // Extract journal
  const journal = Array.isArray(work['container-title']) 
    ? work['container-title'][0] 
    : work['container-title'] || null;
  
  return {
    id: `crossref_${work.DOI || Date.now()}`,
    title,
    authors,
    year,
    journal,
    volume: work.volume || null,
    issue: work.issue || null,
    pages: work.page || null,
    doi: work.DOI || null,
    pmid: null,
    abstract: work.abstract ? stripHTML(work.abstract) : null,
    source: 'crossref',
  };
}

/**
 * Decode XML entities
 */
function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Strip HTML tags
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Format citation in APA style
 */
export function formatAPACitation(study: StudyMetadata): string {
  const authorStr = study.authors.length > 0 
    ? study.authors.slice(0, 3).join(', ') + (study.authors.length > 3 ? ', et al.' : '')
    : 'Unknown';
  
  const year = study.year || 'n.d.';
  const title = study.title;
  const journal = study.journal || 'Unknown Journal';
  const volume = study.volume || '';
  const issue = study.issue ? `(${study.issue})` : '';
  const pages = study.pages || '';
  const doi = study.doi ? `https://doi.org/${study.doi}` : '';
  
  let citation = `${authorStr} (${year}). ${title}. ${journal}`;
  if (volume) citation += `, ${volume}${issue}`;
  if (pages) citation += `, ${pages}`;
  citation += '.';
  if (doi) citation += ` ${doi}`;
  
  return citation;
}

/**
 * Convert study metadata to spreadsheet row format
 */
export function studyToSpreadsheetRow(study: StudyMetadata): Record<string, string | number> {
  const firstAuthor = study.authors[0]?.split(' ')[0] || 'Unknown';
  const studyLabel = `${firstAuthor} ${study.year || ''}`.trim();
  
  return {
    study: studyLabel,
    year: study.year || '',
    authors: study.authors.join('; '),
    journal: study.journal || '',
    doi: study.doi || '',
    pmid: study.pmid || '',
    // Leave outcome data empty for user to fill
    n_treatment: '',
    n_control: '',
    events_treatment: '',
    events_control: '',
    mean_treatment: '',
    mean_control: '',
    sd_treatment: '',
    sd_control: '',
  };
}
