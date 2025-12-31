/**
 * Project Workspace Storage
 * Manages persistent storage for projects, study data, R scripts, and plots
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const PROJECTS_KEY = "@meta_agent/projects";
const CURRENT_PROJECT_KEY = "@meta_agent/current_project";

// Types
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  studies: StudyData[];
  scripts: RScript[];
  plots: SavedPlot[];
  prismaFlowchart?: PRISMAFlowchart;
  settings: ProjectSettings;
}

export interface StudyData {
  id: string;
  name: string;
  type: "binary" | "continuous" | "proportion";
  csvData: string;
  columns: Record<string, string>;
  createdAt: number;
}

export interface RScript {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastRun?: number;
}

export interface SavedPlot {
  id: string;
  name: string;
  type: "forest" | "funnel" | "rob" | "regression" | "network" | "prisma" | "custom";
  imageData: string; // Base64 encoded
  createdAt: number;
  scriptId?: string; // Reference to the script that generated it
}

export interface PRISMAFlowchart {
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

export interface ProjectSettings {
  defaultMeasure: "OR" | "RR" | "MD" | "SMD";
  confidenceLevel: number;
  randomEffects: boolean;
  theme: "dark" | "light" | "auto";
}

// Default project settings
const DEFAULT_SETTINGS: ProjectSettings = {
  defaultMeasure: "OR",
  confidenceLevel: 0.95,
  randomEffects: true,
  theme: "auto",
};

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description: string = ""
): Promise<Project> {
  const projects = await getProjects();
  
  const newProject: Project = {
    id: generateId(),
    name,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    studies: [],
    scripts: [],
    plots: [],
    settings: { ...DEFAULT_SETTINGS },
  };
  
  projects.push(newProject);
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  
  // Set as current project
  await setCurrentProject(newProject.id);
  
  return newProject;
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "createdAt">>
): Promise<Project | null> {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.id === id);
  
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return projects[index];
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  
  if (filtered.length === projects.length) return false;
  
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  
  // Clear current project if it was deleted
  const currentId = await getCurrentProjectId();
  if (currentId === id) {
    await AsyncStorage.removeItem(CURRENT_PROJECT_KEY);
  }
  
  return true;
}

/**
 * Get current project ID
 */
export async function getCurrentProjectId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_PROJECT_KEY);
  } catch {
    return null;
  }
}

/**
 * Set current project
 */
export async function setCurrentProject(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_PROJECT_KEY, id);
}

/**
 * Get current project
 */
export async function getCurrentProject(): Promise<Project | null> {
  const id = await getCurrentProjectId();
  if (!id) return null;
  return getProject(id);
}

// Study data operations
export async function addStudyData(
  projectId: string,
  study: Omit<StudyData, "id" | "createdAt">
): Promise<StudyData | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  const newStudy: StudyData = {
    ...study,
    id: generateId(),
    createdAt: Date.now(),
  };
  
  project.studies.push(newStudy);
  await updateProject(projectId, { studies: project.studies });
  
  return newStudy;
}

export async function removeStudyData(
  projectId: string,
  studyId: string
): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project) return false;
  
  const filtered = project.studies.filter((s) => s.id !== studyId);
  if (filtered.length === project.studies.length) return false;
  
  await updateProject(projectId, { studies: filtered });
  return true;
}

// R script operations
export async function addScript(
  projectId: string,
  script: Omit<RScript, "id" | "createdAt" | "updatedAt">
): Promise<RScript | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  const newScript: RScript = {
    ...script,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  project.scripts.push(newScript);
  await updateProject(projectId, { scripts: project.scripts });
  
  return newScript;
}

export async function updateScript(
  projectId: string,
  scriptId: string,
  updates: Partial<Omit<RScript, "id" | "createdAt">>
): Promise<RScript | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  const index = project.scripts.findIndex((s) => s.id === scriptId);
  if (index === -1) return null;
  
  project.scripts[index] = {
    ...project.scripts[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  await updateProject(projectId, { scripts: project.scripts });
  return project.scripts[index];
}

export async function removeScript(
  projectId: string,
  scriptId: string
): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project) return false;
  
  const filtered = project.scripts.filter((s) => s.id !== scriptId);
  if (filtered.length === project.scripts.length) return false;
  
  await updateProject(projectId, { scripts: filtered });
  return true;
}

// Plot operations
export async function addPlot(
  projectId: string,
  plot: Omit<SavedPlot, "id" | "createdAt">
): Promise<SavedPlot | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  const newPlot: SavedPlot = {
    ...plot,
    id: generateId(),
    createdAt: Date.now(),
  };
  
  project.plots.push(newPlot);
  await updateProject(projectId, { plots: project.plots });
  
  return newPlot;
}

export async function removePlot(
  projectId: string,
  plotId: string
): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project) return false;
  
  const filtered = project.plots.filter((p) => p.id !== plotId);
  if (filtered.length === project.plots.length) return false;
  
  await updateProject(projectId, { plots: filtered });
  return true;
}

// PRISMA flowchart operations
export async function updatePRISMAFlowchart(
  projectId: string,
  flowchart: Omit<PRISMAFlowchart, "updatedAt">
): Promise<PRISMAFlowchart | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  const updatedFlowchart: PRISMAFlowchart = {
    ...flowchart,
    updatedAt: Date.now(),
  };
  
  await updateProject(projectId, { prismaFlowchart: updatedFlowchart });
  return updatedFlowchart;
}

// Export/Import operations
export async function exportProject(projectId: string): Promise<string | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  
  return JSON.stringify(project, null, 2);
}

export async function importProject(jsonData: string): Promise<Project | null> {
  try {
    const imported = JSON.parse(jsonData) as Project;
    
    // Generate new ID to avoid conflicts
    imported.id = generateId();
    imported.createdAt = Date.now();
    imported.updatedAt = Date.now();
    
    const projects = await getProjects();
    projects.push(imported);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    
    return imported;
  } catch (error) {
    console.error("Error importing project:", error);
    return null;
  }
}

// Clear all data (for testing/reset)
export async function clearAllProjects(): Promise<void> {
  await AsyncStorage.removeItem(PROJECTS_KEY);
  await AsyncStorage.removeItem(CURRENT_PROJECT_KEY);
}
