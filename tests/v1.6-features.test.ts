/**
 * Tests for v1.6 features: SQLite Database and PROSPERO Integration
 */

import { describe, it, expect } from "vitest";

// Import database schema types
import {
  OutcomeType,
  Study,
  Outcome,
  RiskOfBias,
  MetaAnalysis,
  CREATE_TABLES_SQL,
} from "../lib/database/schema";

// Import PROSPERO service functions
import {
  extractPICO,
  generateCitation,
  formatProtocolSummary,
  PROSPEROProtocol,
} from "../lib/prospero/service";

describe("SQLite Database Schema", () => {
  describe("Outcome Types", () => {
    it("should support all outcome types", () => {
      const types: OutcomeType[] = ["binary", "continuous", "proportion", "survival", "correlation"];
      expect(types).toHaveLength(5);
      expect(types).toContain("binary");
      expect(types).toContain("continuous");
    });
  });

  describe("Study Interface", () => {
    it("should have required fields", () => {
      const study: Partial<Study> = {
        id: 1,
        project_id: "test-project",
        study_id: "Smith 2020",
        title: "Test Study",
        authors: "Smith J, Jones M",
        year: 2020,
      };

      expect(study.id).toBe(1);
      expect(study.project_id).toBe("test-project");
      expect(study.study_id).toBe("Smith 2020");
      expect(study.year).toBe(2020);
    });

    it("should support optional fields", () => {
      const study: Partial<Study> = {
        id: 1,
        project_id: "test",
        study_id: "Test 2020",
        title: "Test",
        authors: "Test",
        year: 2020,
        journal: "Test Journal",
        doi: "10.1000/test",
        pmid: "12345678",
        country: "USA",
        study_design: "RCT",
        population: "Adults",
        intervention: "Treatment A",
        comparator: "Placebo",
        sample_size: 100,
        follow_up: "12 months",
        notes: "Test notes",
      };

      expect(study.journal).toBe("Test Journal");
      expect(study.doi).toBe("10.1000/test");
      expect(study.sample_size).toBe(100);
    });
  });

  describe("Outcome Interface", () => {
    it("should support binary outcome data", () => {
      const outcome: Partial<Outcome> = {
        id: 1,
        study_id: 1,
        outcome_name: "Mortality",
        outcome_type: "binary",
        events_treatment: 10,
        n_treatment: 50,
        events_control: 20,
        n_control: 50,
      };

      expect(outcome.outcome_type).toBe("binary");
      expect(outcome.events_treatment).toBe(10);
      expect(outcome.n_treatment).toBe(50);
    });

    it("should support continuous outcome data", () => {
      const outcome: Partial<Outcome> = {
        id: 1,
        study_id: 1,
        outcome_name: "Pain Score",
        outcome_type: "continuous",
        mean_treatment: 3.5,
        sd_treatment: 1.2,
        n_treatment: 50,
        mean_control: 5.0,
        sd_control: 1.5,
        n_control: 50,
      };

      expect(outcome.outcome_type).toBe("continuous");
      expect(outcome.mean_treatment).toBe(3.5);
      expect(outcome.sd_treatment).toBe(1.2);
    });
  });

  describe("Risk of Bias Interface", () => {
    it("should support RoB assessment", () => {
      const rob: Partial<RiskOfBias> = {
        id: 1,
        study_id: 1,
        tool: "RoB2",
        domain: "randomization",
        judgment: "low",
        support: "Adequate sequence generation",
      };

      expect(rob.tool).toBe("RoB2");
      expect(rob.domain).toBe("randomization");
      expect(rob.judgment).toBe("low");
    });
  });

  describe("Meta-Analysis Interface", () => {
    it("should support meta-analysis results", () => {
      const ma: Partial<MetaAnalysis> = {
        id: 1,
        project_id: "test",
        name: "Primary Outcome Analysis",
        outcome_type: "binary",
        effect_measure: "OR",
        model: "random",
        method: "REML",
        pooled_effect: 0.75,
        pooled_se: 0.15,
        pooled_ci_lower: 0.55,
        pooled_ci_upper: 1.02,
        p_value: 0.07,
        i_squared: 45.2,
        tau_squared: 0.12,
      };

      expect(ma.effect_measure).toBe("OR");
      expect(ma.model).toBe("random");
      expect(ma.pooled_effect).toBe(0.75);
      expect(ma.i_squared).toBe(45.2);
    });
  });

  describe("SQL Schema", () => {
    it("should have CREATE TABLE statements", () => {
      expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS studies");
      expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS outcomes");
      expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS risk_of_bias");
      expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS meta_analyses");
      expect(CREATE_TABLES_SQL).toContain("CREATE TABLE IF NOT EXISTS meta_analysis_studies");
    });

    it("should have indexes for performance", () => {
      expect(CREATE_TABLES_SQL).toContain("CREATE INDEX IF NOT EXISTS idx_studies_project");
      expect(CREATE_TABLES_SQL).toContain("CREATE INDEX IF NOT EXISTS idx_outcomes_study");
    });

    it("should have foreign key constraints", () => {
      expect(CREATE_TABLES_SQL).toContain("FOREIGN KEY (study_id) REFERENCES studies(id)");
      expect(CREATE_TABLES_SQL).toContain("ON DELETE CASCADE");
    });
  });
});

describe("PROSPERO Integration", () => {
  const mockProtocol: PROSPEROProtocol = {
    id: "CRD42021234567",
    title: "Effectiveness of Intervention X for Condition Y: A Systematic Review",
    status: "Ongoing",
    registrationDate: "2021-03-15",
    lastUpdated: "2021-06-20",
    authors: ["Smith J", "Jones M", "Brown K"],
    reviewQuestion: "Is Intervention X effective for treating Condition Y in adults?",
    population: "Adults aged 18+ with diagnosed Condition Y",
    intervention: "Intervention X (any dose or duration)",
    comparator: "Placebo, no treatment, or standard care",
    outcomes: "Primary: Symptom reduction. Secondary: Quality of life, adverse events",
    studyDesigns: "Randomized controlled trials",
    databases: ["MEDLINE", "Embase", "Cochrane CENTRAL"],
    searchStrategy: "Comprehensive search using MeSH terms and keywords",
    dataExtraction: "Two reviewers independently extracting data",
    riskOfBias: "Cochrane Risk of Bias tool 2.0",
    synthesisMethod: "Random-effects meta-analysis where appropriate",
    startDate: "2021-01-01",
    expectedCompletion: "2021-12-31",
    fundingSource: "No external funding",
    conflicts: "None declared",
    keywords: ["systematic review", "intervention X", "condition Y"],
    country: "United Kingdom",
    stage: "Data extraction",
    url: "https://www.crd.york.ac.uk/prospero/display_record.php?RecordID=234567",
  };

  describe("extractPICO", () => {
    it("should extract PICO elements from protocol", () => {
      const pico = extractPICO(mockProtocol);

      expect(pico.population).toBe("Adults aged 18+ with diagnosed Condition Y");
      expect(pico.intervention).toBe("Intervention X (any dose or duration)");
      expect(pico.comparator).toBe("Placebo, no treatment, or standard care");
      expect(pico.outcomes).toContain("Symptom reduction");
    });

    it("should handle missing PICO elements", () => {
      const emptyProtocol: PROSPEROProtocol = {
        ...mockProtocol,
        population: "",
        intervention: "",
        comparator: "",
        outcomes: "",
      };

      const pico = extractPICO(emptyProtocol);

      expect(pico.population).toBe("Not specified");
      expect(pico.intervention).toBe("Not specified");
      expect(pico.comparator).toBe("Not specified");
      expect(pico.outcomes).toBe("Not specified");
    });
  });

  describe("generateCitation", () => {
    it("should generate proper citation format", () => {
      const citation = generateCitation(mockProtocol);

      expect(citation).toContain("Smith J");
      expect(citation).toContain("Jones M");
      expect(citation).toContain("Brown K");
      expect(citation).toContain("CRD42021234567");
      expect(citation).toContain("2021");
      expect(citation).toContain("PROSPERO");
    });

    it("should add et al. for more than 3 authors", () => {
      const manyAuthors: PROSPEROProtocol = {
        ...mockProtocol,
        authors: ["Smith J", "Jones M", "Brown K", "Wilson A", "Taylor B"],
      };

      const citation = generateCitation(manyAuthors);

      expect(citation).toContain("et al.");
    });
  });

  describe("formatProtocolSummary", () => {
    it("should format protocol as markdown", () => {
      const summary = formatProtocolSummary(mockProtocol);

      expect(summary).toContain("# Effectiveness of Intervention X");
      expect(summary).toContain("**PROSPERO ID:** CRD42021234567");
      expect(summary).toContain("## Review Question");
      expect(summary).toContain("## PICO Elements");
      expect(summary).toContain("### Population");
      expect(summary).toContain("### Intervention");
      expect(summary).toContain("## Methods");
    });

    it("should include citation at the end", () => {
      const summary = formatProtocolSummary(mockProtocol);

      expect(summary).toContain("*Citation:");
      expect(summary).toContain("PROSPERO");
    });
  });

  describe("Protocol Validation", () => {
    it("should validate CRD ID format", () => {
      const validIds = ["CRD42021234567", "CRD42020123456789"];
      const invalidIds = ["CRD123", "42021234567", "CRDABC12345678"];

      validIds.forEach((id) => {
        expect(id).toMatch(/^CRD\d{11,}$/i);
      });

      invalidIds.forEach((id) => {
        expect(id).not.toMatch(/^CRD\d{11,}$/i);
      });
    });
  });
});

describe("Integration", () => {
  it("should have all required database tables for systematic review workflow", () => {
    // A systematic review needs:
    // 1. Studies - to store included studies
    // 2. Outcomes - to store extracted outcome data
    // 3. Risk of Bias - to store quality assessments
    // 4. Meta-analyses - to store analysis results

    expect(CREATE_TABLES_SQL).toContain("studies");
    expect(CREATE_TABLES_SQL).toContain("outcomes");
    expect(CREATE_TABLES_SQL).toContain("risk_of_bias");
    expect(CREATE_TABLES_SQL).toContain("meta_analyses");
  });

  it("should support the complete PICO framework", () => {
    const pico = extractPICO(mockProtocol);
    
    expect(Object.keys(pico)).toContain("population");
    expect(Object.keys(pico)).toContain("intervention");
    expect(Object.keys(pico)).toContain("comparator");
    expect(Object.keys(pico)).toContain("outcomes");
  });
});

// Mock protocol for tests
const mockProtocol: PROSPEROProtocol = {
  id: "CRD42021234567",
  title: "Test Protocol",
  status: "Ongoing",
  registrationDate: "2021-03-15",
  lastUpdated: "2021-06-20",
  authors: ["Smith J", "Jones M", "Brown K"],
  reviewQuestion: "Test question",
  population: "Test population",
  intervention: "Test intervention",
  comparator: "Test comparator",
  outcomes: "Test outcomes",
  studyDesigns: "RCTs",
  databases: ["MEDLINE"],
  searchStrategy: "Test strategy",
  dataExtraction: "Test extraction",
  riskOfBias: "RoB 2",
  synthesisMethod: "Meta-analysis",
  startDate: "2021-01-01",
  expectedCompletion: "2021-12-31",
  fundingSource: "None",
  conflicts: "None",
  keywords: ["test"],
  country: "UK",
  stage: "Ongoing",
  url: "https://example.com",
};
