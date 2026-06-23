import { WORKFLOW_VERSION } from "./workflowSchema.js";

/**
 * Strip runtime-only fields before persistence.
 * @param {import('@xyflow/react').Node} node
 */
function serializeNode(node) {
  const data = { ...(node.data ?? {}) };
  delete data.onChange;
  delete data.onFocus;
  delete data.executionStatus;

  return {
    id: node.id,
    type: node.type ?? "process",
    position: { ...node.position },
    data,
    ...(node.style ? { style: node.style } : {}),
    ...(node.className ? { className: node.className } : {}),
  };
}

/**
 * @param {import('@xyflow/react').Edge} edge
 */
function serializeEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle != null ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle != null ? { targetHandle: edge.targetHandle } : {}),
  };
}

/**
 * @param {{
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 *   metadata?: import('./workflowSchema.js').WorkflowMetadata,
 *   viewport?: import('./workflowSchema.js').Viewport | null,
 * }} workflow
 * @returns {import('./workflowSchema.js').WorkflowDocument}
 */
export function serializeWorkflow({ nodes, edges, metadata = {}, viewport = null }) {
  const now = new Date().toISOString();

  return {
    version: WORKFLOW_VERSION,
    metadata: {
      name: metadata.name ?? "Untitled Workflow",
      createdAt: metadata.createdAt ?? now,
      updatedAt: now,
    },
    nodes: nodes.map(serializeNode),
    edges: edges.map(serializeEdge),
    viewport,
  };
}
