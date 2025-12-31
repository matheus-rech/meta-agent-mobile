/**
 * SQLite Database Service
 * Provides CRUD operations for study data
 */

import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import {
  CREATE_TABLES_SQL,
  DROP_TABLES_SQL,
  Study,
  Outcome,
  RiskOfBias,
  MetaAnalysis,
  OutcomeType,
} from "./schema";

const DB_NAME = "meta_agent.db";

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database connection and create tables
 */
export async function initDatabase(): Promise<void> {
  if (Platform.OS === "web") {
    console.log("SQLite not supported on web, using fallback storage");
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create tables
    await db.execAsync(CREATE_TABLES_SQL);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Reset the database (drop and recreate all tables)
 */
export async function resetDatabase(): Promise<void> {
  if (!db) await initDatabase();
  if (!db) return;

  await db.execAsync(DROP_TABLES_SQL);
  await db.execAsync(CREATE_TABLES_SQL);
}

// ============ Study Operations ============

export interface CreateStudyInput {
  project_id: string;
  study_id: string;
  title: string;
  authors: string;
  year: number;
  journal?: string;
  doi?: string;
  pmid?: string;
  country?: string;
  study_design?: string;
  population?: string;
  intervention?: string;
  comparator?: string;
  sample_size?: number;
  follow_up?: string;
  notes?: string;
}

export async function createStudy(input: CreateStudyInput): Promise<Study | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.runAsync(
    `INSERT INTO studies (
      project_id, study_id, title, authors, year, journal, doi, pmid,
      country, study_design, population, intervention, comparator,
      sample_size, follow_up, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.project_id,
      input.study_id,
      input.title,
      input.authors,
      input.year,
      input.journal ?? null,
      input.doi ?? null,
      input.pmid ?? null,
      input.country ?? null,
      input.study_design ?? null,
      input.population ?? null,
      input.intervention ?? null,
      input.comparator ?? null,
      input.sample_size ?? null,
      input.follow_up ?? null,
      input.notes ?? null,
    ]
  );

  if (result.lastInsertRowId) {
    return getStudyById(result.lastInsertRowId);
  }
  return null;
}

export async function getStudyById(id: number): Promise<Study | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.getFirstAsync<Study>(
    "SELECT * FROM studies WHERE id = ?",
    [id]
  );
  return result ?? null;
}

export async function getStudiesByProject(projectId: string): Promise<Study[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const results = await db.getAllAsync<Study>(
    "SELECT * FROM studies WHERE project_id = ? ORDER BY year DESC, authors ASC",
    [projectId]
  );
  return results;
}

export async function updateStudy(id: number, updates: Partial<CreateStudyInput>): Promise<Study | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value ?? null);
    }
  });

  if (fields.length === 0) return getStudyById(id);

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  await db.runAsync(
    `UPDATE studies SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getStudyById(id);
}

export async function deleteStudy(id: number): Promise<boolean> {
  if (!db) await initDatabase();
  if (!db) return false;

  const result = await db.runAsync("DELETE FROM studies WHERE id = ?", [id]);
  return result.changes > 0;
}

export async function searchStudies(
  projectId: string,
  query: string
): Promise<Study[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const searchTerm = `%${query}%`;
  const results = await db.getAllAsync<Study>(
    `SELECT * FROM studies 
     WHERE project_id = ? 
     AND (title LIKE ? OR authors LIKE ? OR study_id LIKE ? OR journal LIKE ?)
     ORDER BY year DESC`,
    [projectId, searchTerm, searchTerm, searchTerm, searchTerm]
  );
  return results;
}

// ============ Outcome Operations ============

export interface CreateOutcomeInput {
  study_id: number;
  outcome_name: string;
  outcome_type: OutcomeType;
  events_treatment?: number;
  n_treatment?: number;
  events_control?: number;
  n_control?: number;
  mean_treatment?: number;
  sd_treatment?: number;
  mean_control?: number;
  sd_control?: number;
  effect_size?: number;
  se?: number;
  ci_lower?: number;
  ci_upper?: number;
  subgroup?: string;
  time_point?: string;
  notes?: string;
}

export async function createOutcome(input: CreateOutcomeInput): Promise<Outcome | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.runAsync(
    `INSERT INTO outcomes (
      study_id, outcome_name, outcome_type,
      events_treatment, n_treatment, events_control, n_control,
      mean_treatment, sd_treatment, mean_control, sd_control,
      effect_size, se, ci_lower, ci_upper,
      subgroup, time_point, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.study_id,
      input.outcome_name,
      input.outcome_type,
      input.events_treatment ?? null,
      input.n_treatment ?? null,
      input.events_control ?? null,
      input.n_control ?? null,
      input.mean_treatment ?? null,
      input.sd_treatment ?? null,
      input.mean_control ?? null,
      input.sd_control ?? null,
      input.effect_size ?? null,
      input.se ?? null,
      input.ci_lower ?? null,
      input.ci_upper ?? null,
      input.subgroup ?? null,
      input.time_point ?? null,
      input.notes ?? null,
    ]
  );

  if (result.lastInsertRowId) {
    return getOutcomeById(result.lastInsertRowId);
  }
  return null;
}

export async function getOutcomeById(id: number): Promise<Outcome | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.getFirstAsync<Outcome>(
    "SELECT * FROM outcomes WHERE id = ?",
    [id]
  );
  return result ?? null;
}

export async function getOutcomesByStudy(studyId: number): Promise<Outcome[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const results = await db.getAllAsync<Outcome>(
    "SELECT * FROM outcomes WHERE study_id = ? ORDER BY outcome_name",
    [studyId]
  );
  return results;
}

export async function deleteOutcome(id: number): Promise<boolean> {
  if (!db) await initDatabase();
  if (!db) return false;

  const result = await db.runAsync("DELETE FROM outcomes WHERE id = ?", [id]);
  return result.changes > 0;
}

// ============ Risk of Bias Operations ============

export interface CreateRoBInput {
  study_id: number;
  tool: string;
  domain: string;
  judgment: string;
  support?: string;
}

export async function createRiskOfBias(input: CreateRoBInput): Promise<RiskOfBias | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.runAsync(
    `INSERT INTO risk_of_bias (study_id, tool, domain, judgment, support)
     VALUES (?, ?, ?, ?, ?)`,
    [input.study_id, input.tool, input.domain, input.judgment, input.support ?? null]
  );

  if (result.lastInsertRowId) {
    const rob = await db.getFirstAsync<RiskOfBias>(
      "SELECT * FROM risk_of_bias WHERE id = ?",
      [result.lastInsertRowId]
    );
    return rob ?? null;
  }
  return null;
}

export async function getRoBByStudy(studyId: number): Promise<RiskOfBias[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const results = await db.getAllAsync<RiskOfBias>(
    "SELECT * FROM risk_of_bias WHERE study_id = ? ORDER BY domain",
    [studyId]
  );
  return results;
}

// ============ Meta-Analysis Operations ============

export interface CreateMetaAnalysisInput {
  project_id: string;
  name: string;
  description?: string;
  outcome_type: OutcomeType;
  effect_measure: string;
  model: string;
  method: string;
}

export async function createMetaAnalysis(input: CreateMetaAnalysisInput): Promise<MetaAnalysis | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.runAsync(
    `INSERT INTO meta_analyses (
      project_id, name, description, outcome_type, effect_measure, model, method
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.project_id,
      input.name,
      input.description ?? null,
      input.outcome_type,
      input.effect_measure,
      input.model,
      input.method,
    ]
  );

  if (result.lastInsertRowId) {
    return getMetaAnalysisById(result.lastInsertRowId);
  }
  return null;
}

export async function getMetaAnalysisById(id: number): Promise<MetaAnalysis | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.getFirstAsync<MetaAnalysis>(
    "SELECT * FROM meta_analyses WHERE id = ?",
    [id]
  );
  return result ?? null;
}

export async function getMetaAnalysesByProject(projectId: string): Promise<MetaAnalysis[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const results = await db.getAllAsync<MetaAnalysis>(
    "SELECT * FROM meta_analyses WHERE project_id = ? ORDER BY created_at DESC",
    [projectId]
  );
  return results;
}

export async function updateMetaAnalysisResults(
  id: number,
  results: {
    pooled_effect?: number;
    pooled_se?: number;
    pooled_ci_lower?: number;
    pooled_ci_upper?: number;
    p_value?: number;
    i_squared?: number;
    tau_squared?: number;
    q_statistic?: number;
    q_df?: number;
    q_p_value?: number;
    r_code?: string;
    forest_plot?: string;
    funnel_plot?: string;
  }
): Promise<MetaAnalysis | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(results).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value ?? null);
    }
  });

  if (fields.length === 0) return getMetaAnalysisById(id);

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  await db.runAsync(
    `UPDATE meta_analyses SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getMetaAnalysisById(id);
}

// ============ Import/Export Operations ============

export interface StudyCSVRow {
  study_id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  doi?: string;
  pmid?: string;
  country?: string;
  study_design?: string;
  population?: string;
  intervention?: string;
  comparator?: string;
  sample_size?: string;
  follow_up?: string;
  notes?: string;
}

export async function importStudiesFromCSV(
  projectId: string,
  rows: StudyCSVRow[]
): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const year = parseInt(row.year);
      if (isNaN(year)) {
        errors.push(`Row ${i + 1}: Invalid year "${row.year}"`);
        continue;
      }

      await createStudy({
        project_id: projectId,
        study_id: row.study_id,
        title: row.title,
        authors: row.authors,
        year,
        journal: row.journal,
        doi: row.doi,
        pmid: row.pmid,
        country: row.country,
        study_design: row.study_design,
        population: row.population,
        intervention: row.intervention,
        comparator: row.comparator,
        sample_size: row.sample_size ? parseInt(row.sample_size) : undefined,
        follow_up: row.follow_up,
        notes: row.notes,
      });
      imported++;
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { imported, errors };
}

export async function exportStudiesToJSON(projectId: string): Promise<string> {
  const studies = await getStudiesByProject(projectId);
  const studiesWithOutcomes = await Promise.all(
    studies.map(async (study) => {
      const outcomes = await getOutcomesByStudy(study.id);
      const rob = await getRoBByStudy(study.id);
      return { ...study, outcomes, risk_of_bias: rob };
    })
  );
  return JSON.stringify(studiesWithOutcomes, null, 2);
}

// ============ Statistics ============

export async function getProjectStats(projectId: string): Promise<{
  totalStudies: number;
  totalOutcomes: number;
  totalMetaAnalyses: number;
  studiesByYear: { year: number; count: number }[];
  outcomeTypes: { type: string; count: number }[];
}> {
  if (!db) await initDatabase();
  if (!db) {
    return {
      totalStudies: 0,
      totalOutcomes: 0,
      totalMetaAnalyses: 0,
      studiesByYear: [],
      outcomeTypes: [],
    };
  }

  const studyCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM studies WHERE project_id = ?",
    [projectId]
  );

  const outcomeCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM outcomes o
     JOIN studies s ON o.study_id = s.id
     WHERE s.project_id = ?`,
    [projectId]
  );

  const maCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM meta_analyses WHERE project_id = ?",
    [projectId]
  );

  const studiesByYear = await db.getAllAsync<{ year: number; count: number }>(
    `SELECT year, COUNT(*) as count FROM studies 
     WHERE project_id = ? GROUP BY year ORDER BY year`,
    [projectId]
  );

  const outcomeTypes = await db.getAllAsync<{ type: string; count: number }>(
    `SELECT outcome_type as type, COUNT(*) as count FROM outcomes o
     JOIN studies s ON o.study_id = s.id
     WHERE s.project_id = ? GROUP BY outcome_type`,
    [projectId]
  );

  return {
    totalStudies: studyCount?.count ?? 0,
    totalOutcomes: outcomeCount?.count ?? 0,
    totalMetaAnalyses: maCount?.count ?? 0,
    studiesByYear,
    outcomeTypes,
  };
}
