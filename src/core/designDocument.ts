import { DesignFolder, Project } from '../types';

export const DESIGN_SCHEMA_VERSION = 2;

export interface DesignDocument {
  schemaVersion: number;
  projects: Project[];
  activeProjectId: string | null;
  folders: DesignFolder[];
}

export function createDesignDocument(
  projects: Project[],
  activeProjectId: string | null,
  folders: DesignFolder[] = []
): DesignDocument {
  return {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    projects,
    activeProjectId,
    folders,
  };
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<Project>;
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    Array.isArray(project.sheets) &&
    typeof project.activeSheetId === 'string'
  );
}

function isFolder(value: unknown): value is DesignFolder {
  if (!value || typeof value !== 'object') return false;
  const folder = value as Partial<DesignFolder>;
  return (
    typeof folder.id === 'string' &&
    typeof folder.name === 'string' &&
    typeof folder.createdAt === 'number' &&
    typeof folder.updatedAt === 'number'
  );
}

function migrateLegacyProjects(value: unknown): DesignDocument | null {
  if (!Array.isArray(value) || !value.every(isProject)) return null;
  return createDesignDocument(value, null, []);
}

export function parseDesignDocument(raw: string): DesignDocument | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    const legacyDocument = migrateLegacyProjects(parsed);
    if (legacyDocument) return legacyDocument;

    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<DesignDocument>;
    if (
      typeof candidate.schemaVersion !== 'number' ||
      !Array.isArray(candidate.projects) ||
      !candidate.projects.every(isProject)
    ) {
      return null;
    }

    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter(isFolder)
      : [];

    return createDesignDocument(
      candidate.projects,
      typeof candidate.activeProjectId === 'string' ? candidate.activeProjectId : null,
      folders
    );
  } catch {
    return null;
  }
}

export function serializeDesignDocument(
  projects: Project[],
  activeProjectId: string | null,
  folders: DesignFolder[] = []
): string {
  return JSON.stringify(createDesignDocument(projects, activeProjectId, folders), null, 2);
}
