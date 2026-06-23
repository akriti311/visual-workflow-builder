/** @typedef {{ x: number, y: number, zoom: number }} Viewport */

/**
 * @typedef {{
 *   name?: string,
 *   createdAt?: string,
 *   updatedAt?: string,
 * }} WorkflowMetadata
 */

/**
 * @typedef {{
 *   version: number,
 *   metadata: WorkflowMetadata,
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 *   viewport?: Viewport | null,
 * }} WorkflowDocument
 */

export const WORKFLOW_VERSION = 1;
export const STORAGE_KEY = "workflow";
export const MAX_HISTORY = 50;
export const AUTOSAVE_DEBOUNCE_MS = 400;
