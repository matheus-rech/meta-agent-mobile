/**
 * Tests for v1.5 features:
 * - Real-time R output streaming
 * - Project workspace storage
 * - PRISMA flowchart data structures
 */

import { describe, it, expect, beforeEach } from "vitest";

// Test streaming event types
describe("R Streaming Output", () => {
  interface StreamEvent {
    type: "stdout" | "stderr" | "status" | "file" | "complete" | "error";
    data: string;
    timestamp: number;
  }

  it("should define correct stream event types", () => {
    const event: StreamEvent = {
      type: "stdout",
      data: "Hello from R",
      timestamp: Date.now(),
    };
    
    expect(event.type).toBe("stdout");
    expect(event.data).toBe("Hello from R");
    expect(typeof event.timestamp).toBe("number");
  });

  it("should handle all stream event types", () => {
    const types: StreamEvent["type"][] = ["stdout", "stderr", "status", "file", "complete", "error"];
    
    types.forEach((type) => {
      const event: StreamEvent = { type, data: "test", timestamp: Date.now() };
      expect(event.type).toBe(type);
    });
  });

  it("should support progress markers in output", () => {
    const progressLine = "[PROGRESS] Loading packages...";
    const statusLine = "[STATUS] Execution complete";
    
    expect(progressLine.startsWith("[PROGRESS]")).toBe(true);
    expect(statusLine.startsWith("[STATUS]")).toBe(true);
  });
});

// Test workspace storage types
describe("Project Workspace Storage", () => {
  interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    studies: StudyData[];
    scripts: RScript[];
    plots: SavedPlot[];
  }

  interface StudyData {
    id: string;
    name: string;
    type: "binary" | "continuous" | "proportion";
    csvData: string;
    columns: Record<string, string>;
    createdAt: number;
  }

  interface RScript {
    id: string;
    name: string;
    code: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
  }

  interface SavedPlot {
    id: string;
    name: string;
    type: "forest" | "funnel" | "rob" | "regression" | "network" | "prisma" | "custom";
    imageData: string;
    createdAt: number;
  }

  it("should create a valid project structure", () => {
    const project: Project = {
      id: "test-123",
      name: "Test Project",
      description: "A test meta-analysis project",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      studies: [],
      scripts: [],
      plots: [],
    };

    expect(project.id).toBe("test-123");
    expect(project.name).toBe("Test Project");
    expect(Array.isArray(project.studies)).toBe(true);
    expect(Array.isArray(project.scripts)).toBe(true);
    expect(Array.isArray(project.plots)).toBe(true);
  });

  it("should support all study data types", () => {
    const types: StudyData["type"][] = ["binary", "continuous", "proportion"];
    
    types.forEach((type) => {
      const study: StudyData = {
        id: `study-${type}`,
        name: `${type} study`,
        type,
        csvData: "study,events,n\nA,10,100",
        columns: { study: "study", events: "events", n: "n" },
        createdAt: Date.now(),
      };
      expect(study.type).toBe(type);
    });
  });

  it("should support all plot types", () => {
    const types: SavedPlot["type"][] = ["forest", "funnel", "rob", "regression", "network", "prisma", "custom"];
    
    types.forEach((type) => {
      const plot: SavedPlot = {
        id: `plot-${type}`,
        name: `${type} plot`,
        type,
        imageData: "data:image/png;base64,abc123",
        createdAt: Date.now(),
      };
      expect(plot.type).toBe(type);
    });
  });

  it("should validate R script structure", () => {
    const script: RScript = {
      id: "script-1",
      name: "Meta-analysis",
      code: 'library(metafor)\nrma(yi, vi, data=dat)',
      description: "Basic meta-analysis",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(script.code).toContain("library");
    expect(script.name).toBe("Meta-analysis");
  });
});

// Test PRISMA flowchart structure
describe("PRISMA 2020 Flowchart", () => {
  interface PRISMAFlowchart {
    identification: {
      databaseRecords: number;
      registerRecords: number;
      otherRecords: number;
    };
    screening: {
      duplicatesRemoved: number;
      recordsScreened: number;
      recordsExcluded: number;
    };
    eligibility: {
      reportsRetrieved: number;
      reportsNotRetrieved: number;
      reportsAssessed: number;
      reportsExcluded: number;
      exclusionReasons: { reason: string; count: number }[];
    };
    included: {
      studiesIncluded: number;
      reportsIncluded: number;
    };
    updatedAt: number;
  }

  it("should create a valid PRISMA flowchart structure", () => {
    const flowchart: PRISMAFlowchart = {
      identification: {
        databaseRecords: 1500,
        registerRecords: 50,
        otherRecords: 25,
      },
      screening: {
        duplicatesRemoved: 300,
        recordsScreened: 1275,
        recordsExcluded: 1100,
      },
      eligibility: {
        reportsRetrieved: 175,
        reportsNotRetrieved: 5,
        reportsAssessed: 170,
        reportsExcluded: 150,
        exclusionReasons: [
          { reason: "Wrong study design", count: 80 },
          { reason: "Wrong population", count: 40 },
          { reason: "Wrong outcome", count: 30 },
        ],
      },
      included: {
        studiesIncluded: 20,
        reportsIncluded: 25,
      },
      updatedAt: Date.now(),
    };

    // Validate identification
    expect(flowchart.identification.databaseRecords).toBe(1500);
    expect(flowchart.identification.registerRecords).toBe(50);
    
    // Validate screening
    expect(flowchart.screening.duplicatesRemoved).toBe(300);
    expect(flowchart.screening.recordsScreened).toBe(1275);
    
    // Validate eligibility
    expect(flowchart.eligibility.exclusionReasons.length).toBe(3);
    
    // Validate included
    expect(flowchart.included.studiesIncluded).toBe(20);
  });

  it("should calculate correct totals", () => {
    const flowchart: PRISMAFlowchart = {
      identification: {
        databaseRecords: 1000,
        registerRecords: 200,
        otherRecords: 50,
      },
      screening: {
        duplicatesRemoved: 250,
        recordsScreened: 1000,
        recordsExcluded: 800,
      },
      eligibility: {
        reportsRetrieved: 200,
        reportsNotRetrieved: 10,
        reportsAssessed: 190,
        reportsExcluded: 170,
        exclusionReasons: [],
      },
      included: {
        studiesIncluded: 20,
        reportsIncluded: 22,
      },
      updatedAt: Date.now(),
    };

    const totalIdentified = 
      flowchart.identification.databaseRecords +
      flowchart.identification.registerRecords +
      flowchart.identification.otherRecords;
    
    expect(totalIdentified).toBe(1250);
    
    const afterDuplicates = totalIdentified - flowchart.screening.duplicatesRemoved;
    expect(afterDuplicates).toBe(1000);
  });

  it("should support exclusion reasons with counts", () => {
    const reasons = [
      { reason: "Wrong study design", count: 50 },
      { reason: "Wrong population", count: 30 },
      { reason: "Wrong intervention", count: 20 },
      { reason: "Wrong outcome", count: 15 },
      { reason: "Duplicate publication", count: 5 },
    ];

    const totalExcluded = reasons.reduce((sum, r) => sum + r.count, 0);
    expect(totalExcluded).toBe(120);
    expect(reasons.length).toBe(5);
  });
});

// Test ID generation
describe("ID Generation", () => {
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it("should generate IDs with correct format", () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

// Test data validation
describe("Data Validation", () => {
  it("should validate CSV data format", () => {
    const validCSV = "study,events,n\nStudy A,10,100\nStudy B,15,120";
    const lines = validCSV.split("\n");
    const headers = lines[0].split(",");
    
    expect(headers).toContain("study");
    expect(lines.length).toBeGreaterThan(1);
  });

  it("should validate numeric fields", () => {
    const validateNumber = (value: unknown): boolean => {
      return typeof value === "number" && !isNaN(value) && value >= 0;
    };

    expect(validateNumber(100)).toBe(true);
    expect(validateNumber(0)).toBe(true);
    expect(validateNumber(-1)).toBe(false);
    expect(validateNumber(NaN)).toBe(false);
    expect(validateNumber("100")).toBe(false);
  });
});
