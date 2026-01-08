/**
 * CrossRef API Service
 * 
 * Integrates with CrossRef REST API to search and fetch article metadata by DOI.
 * Documentation: https://api.crossref.org/swagger-ui/index.html
 */

export interface CrossRefArticle {
  doi: string;
  title: string;
  authors: string[];
  firstAuthor: string;
  year: number;
  journal: string;
  journalAbbrev: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher: string;
  type: string;
  abstract?: string;
  subjects: string[];
  citation: string;
  url: string;
}

export interface CrossRefSearchResult {
  totalResults: number;
  articles: CrossRefArticle[];
}

const CROSSREF_BASE = 'https://api.crossref.org';
const USER_AGENT = 'MetaAgentMobile/1.0 (mailto:support@metaagent.app)';

/**
 * Search CrossRef by query string
 */
export async function searchCrossRef(
  query: string,
  maxResults: number = 20
): Promise<CrossRefSearchResult> {
  try {
    const searchUrl = `${CROSSREF_BASE}/works?query=${encodeURIComponent(query)}&rows=${maxResults}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });
    
    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.message?.items || [];
    const totalResults = data.message?.['total-results'] || 0;
    
    const articles = items.map(parseWorkItem).filter(Boolean) as CrossRefArticle[];
    
    return { totalResults, articles };
  } catch (error) {
    console.error('CrossRef search error:', error);
    throw new Error(`Failed to search CrossRef: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch article by DOI
 */
export async function fetchByDOI(doi: string): Promise<CrossRefArticle | null> {
  try {
    // Clean DOI
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
    
    const fetchUrl = `${CROSSREF_BASE}/works/${encodeURIComponent(cleanDoi)}`;
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`CrossRef API error: ${response.status}`);
    }
    
    const data = await response.json();
    return parseWorkItem(data.message);
  } catch (error) {
    console.error('CrossRef fetch error:', error);
    throw new Error(`Failed to fetch DOI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch fetch articles by DOIs
 */
export async function fetchByDOIs(dois: string[]): Promise<CrossRefArticle[]> {
  const results: CrossRefArticle[] = [];
  
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < dois.length; i += batchSize) {
    const batch = dois.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(doi => fetchByDOI(doi).catch(() => null))
    );
    results.push(...batchResults.filter(Boolean) as CrossRefArticle[]);
    
    // Small delay between batches
    if (i + batchSize < dois.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * Parse CrossRef work item to article
 */
function parseWorkItem(item: Record<string, unknown>): CrossRefArticle | null {
  if (!item || typeof item !== 'object') return null;
  
  const doi = item.DOI as string;
  if (!doi) return null;
  
  // Extract title
  const titleArray = item.title as string[] | undefined;
  const title = titleArray?.[0] || 'Untitled';
  
  // Extract authors
  const authorArray = item.author as Array<{ given?: string; family?: string }> | undefined;
  const authors: string[] = [];
  
  if (authorArray) {
    for (const author of authorArray) {
      if (author.family) {
        const name = author.given 
          ? `${author.family} ${author.given.charAt(0)}`
          : author.family;
        authors.push(name);
      }
    }
  }
  
  const firstAuthor = authors[0] || 'Unknown';
  
  // Extract year
  const published = item.published as { 'date-parts'?: number[][] } | undefined;
  const dateParts = published?.['date-parts']?.[0];
  const year = dateParts?.[0] || new Date().getFullYear();
  
  // Extract journal info
  const containerTitle = item['container-title'] as string[] | undefined;
  const journal = containerTitle?.[0] || '';
  const shortContainerTitle = item['short-container-title'] as string[] | undefined;
  const journalAbbrev = shortContainerTitle?.[0] || journal;
  
  const volume = item.volume as string | undefined;
  const issue = item.issue as string | undefined;
  const pages = item.page as string | undefined;
  
  // Extract publisher and type
  const publisher = item.publisher as string || '';
  const type = item.type as string || 'journal-article';
  
  // Extract abstract (if available)
  const abstract = item.abstract as string | undefined;
  
  // Extract subjects
  const subjectArray = item.subject as string[] | undefined;
  const subjects = subjectArray || [];
  
  // Generate URL
  const url = `https://doi.org/${doi}`;
  
  // Generate citation
  const citation = formatCitation({
    authors,
    year,
    title,
    journal: journalAbbrev,
    volume,
    issue,
    pages,
    doi,
  });
  
  return {
    doi,
    title,
    authors,
    firstAuthor,
    year,
    journal,
    journalAbbrev,
    volume,
    issue,
    pages,
    publisher,
    type,
    abstract: abstract?.replace(/<[^>]+>/g, ''),
    subjects,
    citation,
    url,
  };
}

interface CitationParts {
  authors: string[];
  year: number;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}

function formatCitation(parts: CitationParts): string {
  const { authors, year, title, journal, volume, issue, pages, doi } = parts;
  
  // Format authors (Vancouver style)
  let authorStr = '';
  if (authors.length === 0) {
    authorStr = 'Unknown';
  } else if (authors.length <= 6) {
    authorStr = authors.join(', ');
  } else {
    authorStr = `${authors.slice(0, 6).join(', ')}, et al`;
  }
  
  let citation = `${authorStr}. ${title}. ${journal}. ${year}`;
  
  if (volume) {
    citation += `;${volume}`;
    if (issue) {
      citation += `(${issue})`;
    }
  }
  
  if (pages) {
    citation += `:${pages}`;
  }
  
  citation += '.';
  
  if (doi) {
    citation += ` doi:${doi}`;
  }
  
  return citation;
}

/**
 * Convert CrossRef article to spreadsheet row data
 */
export function articleToSpreadsheetRow(article: CrossRefArticle): Record<string, string> {
  return {
    study: `${article.firstAuthor} ${article.year}`,
    authors: article.authors.join(', '),
    year: article.year.toString(),
    title: article.title,
    journal: article.journalAbbrev,
    doi: article.doi,
    pmid: '', // Not available from CrossRef
  };
}

/**
 * Batch convert articles to spreadsheet rows
 */
export function articlesToSpreadsheetRows(articles: CrossRefArticle[]): Record<string, string>[] {
  return articles.map(articleToSpreadsheetRow);
}

/**
 * Detect if input is a DOI
 */
export function isDOI(input: string): boolean {
  const doiPattern = /^(https?:\/\/doi\.org\/)?10\.\d{4,}\/[^\s]+$/i;
  return doiPattern.test(input.trim());
}

/**
 * Extract DOI from various formats
 */
export function extractDOI(input: string): string | null {
  const patterns = [
    /10\.\d{4,}\/[^\s]+/i,
    /doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

export const crossrefService = {
  search: searchCrossRef,
  fetchByDOI,
  fetchByDOIs,
  articleToRow: articleToSpreadsheetRow,
  articlesToRows: articlesToSpreadsheetRows,
  isDOI,
  extractDOI,
};

export default crossrefService;
