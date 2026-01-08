/**
 * PubMed API Service
 * 
 * Integrates with NCBI E-utilities API to search and fetch article metadata.
 * Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
 */

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  firstAuthor: string;
  year: number;
  journal: string;
  journalAbbrev: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  abstract?: string;
  publicationType: string[];
  meshTerms: string[];
  citation: string;
}

export interface PubMedSearchResult {
  count: number;
  ids: string[];
  articles: PubMedArticle[];
}

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Search PubMed by query string
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 20
): Promise<PubMedSearchResult> {
  try {
    // First, search for IDs
    const searchUrl = `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    const count = parseInt(searchData.esearchresult?.count || '0', 10);
    
    if (ids.length === 0) {
      return { count: 0, ids: [], articles: [] };
    }
    
    // Fetch article details
    const articles = await fetchArticlesByPMID(ids);
    
    return { count, ids, articles };
  } catch (error) {
    console.error('PubMed search error:', error);
    throw new Error(`Failed to search PubMed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch articles by PMID(s)
 */
export async function fetchArticlesByPMID(pmids: string | string[]): Promise<PubMedArticle[]> {
  const idList = Array.isArray(pmids) ? pmids : [pmids];
  
  if (idList.length === 0) {
    return [];
  }
  
  try {
    const fetchUrl = `${EUTILS_BASE}/efetch.fcgi?db=pubmed&id=${idList.join(',')}&retmode=xml`;
    const response = await fetch(fetchUrl);
    const xmlText = await response.text();
    
    return parseArticlesFromXML(xmlText);
  } catch (error) {
    console.error('PubMed fetch error:', error);
    throw new Error(`Failed to fetch PubMed articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse PubMed XML response to extract article metadata
 */
function parseArticlesFromXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  
  // Simple XML parsing without external dependencies
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  
  for (const articleXml of articleMatches) {
    try {
      const article = parseArticle(articleXml);
      if (article) {
        articles.push(article);
      }
    } catch (error) {
      console.warn('Failed to parse article:', error);
    }
  }
  
  return articles;
}

function parseArticle(xml: string): PubMedArticle | null {
  const getTagContent = (tag: string, source: string = xml): string => {
    const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return match ? match[1].trim() : '';
  };
  
  const getAllTagContents = (tag: string, source: string = xml): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
    const results: string[] = [];
    let match;
    while ((match = regex.exec(source)) !== null) {
      results.push(match[1].trim());
    }
    return results;
  };
  
  // Extract PMID
  const pmid = getTagContent('PMID');
  if (!pmid) return null;
  
  // Extract title
  const title = getTagContent('ArticleTitle').replace(/<[^>]+>/g, '');
  
  // Extract authors
  const authorList = xml.match(/<AuthorList[\s\S]*?<\/AuthorList>/)?.[0] || '';
  const authorBlocks = authorList.match(/<Author[\s\S]*?<\/Author>/g) || [];
  const authors: string[] = [];
  
  for (const authorBlock of authorBlocks) {
    const lastName = getTagContent('LastName', authorBlock);
    const foreName = getTagContent('ForeName', authorBlock);
    const initials = getTagContent('Initials', authorBlock);
    
    if (lastName) {
      const name = foreName ? `${lastName} ${initials || foreName.charAt(0)}` : lastName;
      authors.push(name);
    }
  }
  
  const firstAuthor = authors[0] || 'Unknown';
  
  // Extract year
  const pubDateBlock = xml.match(/<PubDate>[\s\S]*?<\/PubDate>/)?.[0] || '';
  let year = parseInt(getTagContent('Year', pubDateBlock), 10);
  if (!year) {
    const medlineDateMatch = getTagContent('MedlineDate', pubDateBlock).match(/(\d{4})/);
    year = medlineDateMatch ? parseInt(medlineDateMatch[1], 10) : new Date().getFullYear();
  }
  
  // Extract journal info
  const journalBlock = xml.match(/<Journal>[\s\S]*?<\/Journal>/)?.[0] || '';
  const journal = getTagContent('Title', journalBlock);
  const journalAbbrev = getTagContent('ISOAbbreviation', journalBlock) || journal;
  const volume = getTagContent('Volume', journalBlock);
  const issue = getTagContent('Issue', journalBlock);
  
  // Extract pagination
  const paginationBlock = xml.match(/<Pagination>[\s\S]*?<\/Pagination>/)?.[0] || '';
  const pages = getTagContent('MedlinePgn', paginationBlock);
  
  // Extract DOI
  const articleIdList = xml.match(/<ArticleIdList>[\s\S]*?<\/ArticleIdList>/)?.[0] || '';
  const doiMatch = articleIdList.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch ? doiMatch[1] : undefined;
  
  // Extract abstract
  const abstractBlock = xml.match(/<Abstract>[\s\S]*?<\/Abstract>/)?.[0] || '';
  const abstractTexts = getAllTagContents('AbstractText', abstractBlock);
  const abstract = abstractTexts.join(' ').replace(/<[^>]+>/g, '');
  
  // Extract publication types
  const pubTypeList = xml.match(/<PublicationTypeList>[\s\S]*?<\/PublicationTypeList>/)?.[0] || '';
  const publicationType = getAllTagContents('PublicationType', pubTypeList);
  
  // Extract MeSH terms
  const meshList = xml.match(/<MeshHeadingList>[\s\S]*?<\/MeshHeadingList>/)?.[0] || '';
  const meshTerms = getAllTagContents('DescriptorName', meshList);
  
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
    pmid,
    title,
    authors,
    firstAuthor,
    year,
    journal,
    journalAbbrev,
    volume,
    issue,
    pages,
    doi,
    abstract,
    publicationType,
    meshTerms,
    citation,
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
 * Convert PubMed article to spreadsheet row data
 */
export function articleToSpreadsheetRow(article: PubMedArticle): Record<string, string> {
  return {
    study: `${article.firstAuthor} ${article.year}`,
    authors: article.authors.join(', '),
    year: article.year.toString(),
    title: article.title,
    journal: article.journalAbbrev,
    pmid: article.pmid,
    doi: article.doi || '',
  };
}

/**
 * Batch convert articles to spreadsheet rows
 */
export function articlesToSpreadsheetRows(articles: PubMedArticle[]): Record<string, string>[] {
  return articles.map(articleToSpreadsheetRow);
}

export const pubmedService = {
  search: searchPubMed,
  fetchByPMID: fetchArticlesByPMID,
  articleToRow: articleToSpreadsheetRow,
  articlesToRows: articlesToSpreadsheetRows,
};

export default pubmedService;
