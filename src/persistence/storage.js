import { deserializeWorkflow } from "./deserialize.js";
import { serializeWorkflow } from "./serialize.js";
import { STORAGE_KEY } from "./workflowSchema.js";

/**
 * @param {import('./workflowSchema.js').WorkflowDocument} document
 */
export function saveToLocalStorage(document) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

/**
 * @returns {import('./workflowSchema.js').WorkflowDocument | null}
 */
export function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return deserializeWorkflow(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * @param {{
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 *   metadata?: import('./workflowSchema.js').WorkflowMetadata,
 *   viewport?: import('./workflowSchema.js').Viewport | null,
 * }} workflow
 * @param {string} [filename]
 */
export function exportWorkflowToFile(workflow, filename) {
  const workflowDoc = serializeWorkflow(workflow);
  const blob = new Blob([JSON.stringify(workflowDoc, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const safeName = (workflow.metadata?.name ?? "workflow")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .toLowerCase();

  anchor.href = url;
  anchor.download = filename ?? `${safeName || "workflow"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * @returns {Promise<import('./workflowSchema.js').WorkflowDocument>}
 */
export function importWorkflowFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected."));
        return;
      }

      try {
        const text = await file.text();
        resolve(deserializeWorkflow(JSON.parse(text)));
      } catch (error) {
        reject(error);
      }
    };

    input.click();
  });
}
