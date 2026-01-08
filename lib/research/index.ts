/**
 * Research Services Module
 * 
 * Exports PubMed and CrossRef integration services.
 */

export {
  pubmedService,
  searchPubMed,
  fetchArticlesByPMID,
  articleToSpreadsheetRow as pubmedArticleToRow,
  articlesToSpreadsheetRows as pubmedArticlesToRows,
  type PubMedArticle,
  type PubMedSearchResult,
} from './pubmed.service';

export {
  crossrefService,
  searchCrossRef,
  fetchByDOI,
  fetchByDOIs,
  articleToSpreadsheetRow as crossrefArticleToRow,
  articlesToSpreadsheetRows as crossrefArticlesToRows,
  isDOI,
  extractDOI,
  type CrossRefArticle,
  type CrossRefSearchResult,
} from './crossref.service';
