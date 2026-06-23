import { sanitizeEdgesToDag } from "../graph/dag.js";
import { NODE_DEFAULTS, normalizeNodeType } from "../constants/nodeTypes.js";
import { WORKFLOW_VERSION } from "./workflowSchema.js";

/**
 * @param {unknown} raw
 * @returns {import('./workflowSchema.js').WorkflowDocument}
 */
export function deserializeWorkflow(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid workflow: expected a JSON object.");
  }

  const doc = /** @type {Record<string, unknown>} */ (raw);

  // Legacy format: { nodes, edges } without version
  if (doc.version == null && Array.isArray(doc.nodes) && Array.isArray(doc.edges)) {
    return normalizeDocument({
      version: WORKFLOW_VERSION,
      metadata: {
        name: "Imported Workflow",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: doc.nodes,
      edges: doc.edges,
      viewport: doc.viewport ?? null,
    });
  }

  if (doc.version !== WORKFLOW_VERSION) {
    throw new Error(
      `Unsupported workflow version: ${String(doc.version)}. Expected ${WORKFLOW_VERSION}.`
    );
  }

  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) {
    throw new Error("Invalid workflow: nodes and edges must be arrays.");
  }

  return normalizeDocument({
    version: WORKFLOW_VERSION,
    metadata: {
      name:
        typeof doc.metadata === "object" &&
        doc.metadata &&
        "name" in doc.metadata &&
        typeof doc.metadata.name === "string"
          ? doc.metadata.name
          : "Untitled Workflow",
      createdAt:
        typeof doc.metadata === "object" &&
        doc.metadata &&
        "createdAt" in doc.metadata &&
        typeof doc.metadata.createdAt === "string"
          ? doc.metadata.createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    nodes: doc.nodes,
    edges: doc.edges,
    viewport:
      doc.viewport &&
      typeof doc.viewport === "object" &&
      "x" in doc.viewport &&
      "y" in doc.viewport &&
      "zoom" in doc.viewport
        ? {
            x: Number(doc.viewport.x),
            y: Number(doc.viewport.y),
            zoom: Number(doc.viewport.zoom),
          }
        : null,
  });
}

function stripRuntimeData(data) {
  if (!data || typeof data !== "object") return { label: "Node", config: {} };
  const rest = { ...data };
  delete rest.onChange;
  delete rest.onFocus;
  delete rest.executionStatus;
  if (!rest.config || typeof rest.config !== "object") {
    rest.config = {};
  }
  return rest;
}

/**
 * @param {import('@xyflow/react').Node} node
 */
function normalizeNode(node) {
  const rawType = node.type === "custom" ? "process" : node.type;
  const type = normalizeNodeType(rawType);
  const defaults = NODE_DEFAULTS[type];
  const data = stripRuntimeData(node.data);

  return {
    ...node,
    type,
    data: {
      label: data.label ?? defaults.label,
      config: { ...defaults.config, ...data.config },
    },
  };
}

/**
 * @param {import('./workflowSchema.js').WorkflowDocument} doc
 */
function normalizeDocument(doc) {
  const nodes = doc.nodes.map(normalizeNode);
  const edges = sanitizeEdgesToDag(nodes, doc.edges);

  return {
    ...doc,
    nodes,
    edges,
  };
}
