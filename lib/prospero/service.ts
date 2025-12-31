/**
 * PROSPERO Integration Service
 * Fetches systematic review protocols from PROSPERO database
 * Note: PROSPERO doesn't have a public API, so we use web scraping
 */

import axios from "axios";

// PROSPERO base URL
const PROSPERO_BASE_URL = "https://www.crd.york.ac.uk/prospero";

// Protocol data structure
export interface PROSPEROProtocol {
  id: string; // CRD number e.g., "CRD42021234567"
  title: string;
  status: string;
  registrationDate: string;
  lastUpdated: string;
  authors: string[];
  reviewQuestion: string;
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  studyDesigns: string;
  databases: string[];
  searchStrategy: string;
  dataExtraction: string;
  riskOfBias: string;
  synthesisMethod: string;
  startDate: string;
  expectedCompletion: string;
  fundingSource: string;
  conflicts: string;
  keywords: string[];
  country: string;
  stage: string;
  url: string;
}

// Search result structure
export interface PROSPEROSearchResult {
  id: string;
  title: string;
  status: string;
  registrationDate: string;
  authors: string;
}

/**
 * Search PROSPERO for protocols matching a query
 */
export async function searchPROSPERO(
  query: string,
  options?: {
    page?: number;
    status?: "ongoing" | "completed" | "all";
  }
): Promise<{ results: PROSPEROSearchResult[]; total: number; page: number }> {
  try {
    // Construct search URL
    const searchUrl = `${PROSPERO_BASE_URL}/search`;
    
    // Make request through our server proxy to handle CORS
    const response = await axios.get("/api/prospero/search", {
      params: {
        q: query,
        page: options?.page || 1,
        status: options?.status || "all",
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error("PROSPERO search error:", error);
    throw new Error("Failed to search PROSPERO. Please try again.");
  }
}

/**
 * Fetch a specific protocol by CRD ID
 */
export async function fetchProtocol(crdId: string): Promise<PROSPEROProtocol | null> {
  try {
    // Validate CRD ID format
    if (!crdId.match(/^CRD\d{11,}$/i)) {
      throw new Error("Invalid CRD ID format. Expected format: CRD42021234567");
    }

    // Fetch through our server proxy
    const response = await axios.get(`/api/prospero/protocol/${crdId}`, {
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error("PROSPERO fetch error:", error);
    throw new Error(`Failed to fetch protocol ${crdId}. Please verify the ID and try again.`);
  }
}

/**
 * Parse PICO elements from a protocol
 */
export function extractPICO(protocol: PROSPEROProtocol): {
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
} {
  return {
    population: protocol.population || "Not specified",
    intervention: protocol.intervention || "Not specified",
    comparator: protocol.comparator || "Not specified",
    outcomes: protocol.outcomes || "Not specified",
  };
}

/**
 * Generate a citation for a PROSPERO protocol
 */
export function generateCitation(protocol: PROSPEROProtocol): string {
  const authors = protocol.authors.slice(0, 3).join(", ");
  const etAl = protocol.authors.length > 3 ? " et al." : "";
  const year = protocol.registrationDate
    ? new Date(protocol.registrationDate).getFullYear()
    : "n.d.";

  return `${authors}${etAl}. ${protocol.title}. PROSPERO ${year} ${protocol.id}. Available from: ${protocol.url}`;
}

/**
 * Format protocol for display
 */
export function formatProtocolSummary(protocol: PROSPEROProtocol): string {
  const pico = extractPICO(protocol);
  
  return `
# ${protocol.title}

**PROSPERO ID:** ${protocol.id}
**Status:** ${protocol.status}
**Registration Date:** ${protocol.registrationDate}

## Review Question
${protocol.reviewQuestion || "Not specified"}

## PICO Elements

### Population
${pico.population}

### Intervention
${pico.intervention}

### Comparator
${pico.comparator}

### Outcomes
${pico.outcomes}

## Methods

### Study Designs
${protocol.studyDesigns || "Not specified"}

### Databases
${protocol.databases?.join(", ") || "Not specified"}

### Risk of Bias Assessment
${protocol.riskOfBias || "Not specified"}

### Data Synthesis
${protocol.synthesisMethod || "Not specified"}

## Timeline
- **Start Date:** ${protocol.startDate || "Not specified"}
- **Expected Completion:** ${protocol.expectedCompletion || "Not specified"}

## Funding
${protocol.fundingSource || "Not specified"}

---
*Citation: ${generateCitation(protocol)}*
`.trim();
}
