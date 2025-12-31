/**
 * Workspace Context Provider
 * Manages global project state and provides hooks for workspace operations
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  Project,
  StudyData,
  RScript,
  SavedPlot,
  PRISMAFlowchart,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getCurrentProject,
  setCurrentProject,
  addStudyData,
  removeStudyData,
  addScript,
  updateScript,
  removeScript,
  addPlot,
  removePlot,
  updatePRISMAFlowchart,
  exportProject,
  importProject,
} from "./storage";

interface WorkspaceContextType {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  
  // Project operations
  loadProjects: () => Promise<void>;
  createNewProject: (name: string, description?: string) => Promise<Project>;
  selectProject: (id: string) => Promise<void>;
  updateCurrentProject: (updates: Partial<Project>) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  
  // Study data operations
  addStudy: (study: Omit<StudyData, "id" | "createdAt">) => Promise<StudyData | null>;
  removeStudy: (studyId: string) => Promise<void>;
  
  // Script operations
  saveScript: (script: Omit<RScript, "id" | "createdAt" | "updatedAt">) => Promise<RScript | null>;
  updateExistingScript: (scriptId: string, updates: Partial<RScript>) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  
  // Plot operations
  savePlot: (plot: Omit<SavedPlot, "id" | "createdAt">) => Promise<SavedPlot | null>;
  deletePlot: (plotId: string) => Promise<void>;
  
  // PRISMA operations
  savePRISMAFlowchart: (flowchart: Omit<PRISMAFlowchart, "updatedAt">) => Promise<void>;
  
  // Export/Import
  exportCurrentProject: () => Promise<string | null>;
  importProjectFromJson: (json: string) => Promise<Project | null>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);
  
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProjects = await getProjects();
      setProjects(allProjects);
      
      const current = await getCurrentProject();
      setCurrentProjectState(current);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createNewProject = useCallback(async (name: string, description: string = "") => {
    const project = await createProject(name, description);
    setProjects((prev) => [...prev, project]);
    setCurrentProjectState(project);
    return project;
  }, []);
  
  const selectProject = useCallback(async (id: string) => {
    await setCurrentProject(id);
    const project = await getProject(id);
    setCurrentProjectState(project);
  }, []);
  
  const updateCurrentProject = useCallback(async (updates: Partial<Project>) => {
    if (!currentProject) return;
    
    const updated = await updateProject(currentProject.id, updates);
    if (updated) {
      setCurrentProjectState(updated);
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }
  }, [currentProject]);
  
  const deleteCurrentProject = useCallback(async () => {
    if (!currentProject) return;
    
    await deleteProject(currentProject.id);
    setProjects((prev) => prev.filter((p) => p.id !== currentProject.id));
    setCurrentProjectState(null);
  }, [currentProject]);
  
  // Study operations
  const addStudy = useCallback(async (study: Omit<StudyData, "id" | "createdAt">) => {
    if (!currentProject) return null;
    
    const newStudy = await addStudyData(currentProject.id, study);
    if (newStudy) {
      await loadProjects();
    }
    return newStudy;
  }, [currentProject, loadProjects]);
  
  const removeStudy = useCallback(async (studyId: string) => {
    if (!currentProject) return;
    
    await removeStudyData(currentProject.id, studyId);
    await loadProjects();
  }, [currentProject, loadProjects]);
  
  // Script operations
  const saveScript = useCallback(async (script: Omit<RScript, "id" | "createdAt" | "updatedAt">) => {
    if (!currentProject) return null;
    
    const newScript = await addScript(currentProject.id, script);
    if (newScript) {
      await loadProjects();
    }
    return newScript;
  }, [currentProject, loadProjects]);
  
  const updateExistingScript = useCallback(async (scriptId: string, updates: Partial<RScript>) => {
    if (!currentProject) return;
    
    await updateScript(currentProject.id, scriptId, updates);
    await loadProjects();
  }, [currentProject, loadProjects]);
  
  const deleteScript = useCallback(async (scriptId: string) => {
    if (!currentProject) return;
    
    await removeScript(currentProject.id, scriptId);
    await loadProjects();
  }, [currentProject, loadProjects]);
  
  // Plot operations
  const savePlot = useCallback(async (plot: Omit<SavedPlot, "id" | "createdAt">) => {
    if (!currentProject) return null;
    
    const newPlot = await addPlot(currentProject.id, plot);
    if (newPlot) {
      await loadProjects();
    }
    return newPlot;
  }, [currentProject, loadProjects]);
  
  const deletePlot = useCallback(async (plotId: string) => {
    if (!currentProject) return;
    
    await removePlot(currentProject.id, plotId);
    await loadProjects();
  }, [currentProject, loadProjects]);
  
  // PRISMA operations
  const savePRISMAFlowchart = useCallback(async (flowchart: Omit<PRISMAFlowchart, "updatedAt">) => {
    if (!currentProject) return;
    
    await updatePRISMAFlowchart(currentProject.id, flowchart);
    await loadProjects();
  }, [currentProject, loadProjects]);
  
  // Export/Import
  const exportCurrentProject = useCallback(async () => {
    if (!currentProject) return null;
    return exportProject(currentProject.id);
  }, [currentProject]);
  
  const importProjectFromJson = useCallback(async (json: string) => {
    const imported = await importProject(json);
    if (imported) {
      await loadProjects();
    }
    return imported;
  }, [loadProjects]);
  
  const value: WorkspaceContextType = {
    projects,
    currentProject,
    isLoading,
    loadProjects,
    createNewProject,
    selectProject,
    updateCurrentProject,
    deleteCurrentProject,
    addStudy,
    removeStudy,
    saveScript,
    updateExistingScript,
    deleteScript,
    savePlot,
    deletePlot,
    savePRISMAFlowchart,
    exportCurrentProject,
    importProjectFromJson,
  };
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
