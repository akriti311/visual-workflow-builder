/** @typedef {'start' | 'process' | 'decision' | 'end'} WorkflowNodeType */

export const NODE_TYPES = /** @type {const} */ ({
  START: "start",
  PROCESS: "process",
  DECISION: "decision",
  END: "end",
});

/** @type {Record<WorkflowNodeType, { label: string, config: Record<string, unknown> }>} */
export const NODE_DEFAULTS = {
  start: {
    label: "Start",
    config: { description: "Workflow entry point" },
  },
  process: {
    label: "Process",
    config: { description: "", durationMs: 1000 },
  },
  decision: {
    label: "Decision",
    config: { description: "", condition: "" },
  },
  end: {
    label: "End",
    config: { description: "Workflow exit point" },
  },
};

/**
 * @param {WorkflowNodeType} type
 * @param {string} id
 * @param {{ x: number, y: number }} position
 */
export function createWorkflowNode(type, id, position) {
  const defaults = NODE_DEFAULTS[type];

  return {
    id,
    type,
    position,
    data: {
      label: defaults.label,
      config: { ...defaults.config },
    },
  };
}

/**
 * @param {string | undefined} type
 * @returns {WorkflowNodeType}
 */
export function normalizeNodeType(type) {
  if (type && type in NODE_DEFAULTS) return /** @type {WorkflowNodeType} */ (type);
  return NODE_TYPES.PROCESS;
}

/**
 * @param {import('@xyflow/react').Node} node
 */
export function getNodeTypeLabel(node) {
  const type = normalizeNodeType(node.type);
  return type.charAt(0).toUpperCase() + type.slice(1);
}
