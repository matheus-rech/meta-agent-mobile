/**
 * WebR Module
 * 
 * Exports WebR service for offline R execution.
 */

export {
  webRService,
  initializeWebR,
  runMetaAnalysis,
  calculateEffectSizes,
  runMetaRegression,
  generateForestPlotData,
  getWebRStatus,
  subscribeToWebRStatus,
  type WebRStatus,
  type MetaAnalysisResult,
  type StudyResult,
  type ForestPlotData,
} from './webr.service';
