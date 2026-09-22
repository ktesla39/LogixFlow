import { Project } from '../types';

export interface ProjectDeletionOutcome {
  projects: Project[];
  nextActiveProjectId: string | null;
  deletedLastProject: boolean;
}

export function getProjectDeletionOutcome(
  projects: Project[],
  projectId: string,
  activeProjectId: string | null
): ProjectDeletionOutcome {
  const remaining = projects.filter((project) => project.id !== projectId);

  if (remaining.length === 0) {
    return {
      projects: [],
      nextActiveProjectId: null,
      deletedLastProject: true,
    };
  }

  const nextActiveProjectId =
    activeProjectId === projectId ? remaining[0].id : activeProjectId && remaining.some((project) => project.id === activeProjectId)
      ? activeProjectId
      : remaining[0].id;

  return {
    projects: remaining,
    nextActiveProjectId,
    deletedLastProject: false,
  };
}
