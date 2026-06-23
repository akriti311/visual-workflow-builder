import { topologicalSort, computeInDegree } from "../graph/topologicalSort.js";
import { NODE_TYPES, normalizeNodeType } from "../constants/nodeTypes.js";

/**
 * @param {import('@xyflow/react').Node[]} nodes
 * @param {import('@xyflow/react').Edge[]} edges
 * @returns {{ ok: true, topologicalOrder: string[] } | { ok: false, message: string }}
 */
export function validateWorkflowForExecution(nodes, edges) {
  if (nodes.length === 0) {
    return { ok: false, message: "Workflow is empty. Add nodes before running." };
  }

  const startNodes = nodes.filter(
    (node) => normalizeNodeType(node.type) === NODE_TYPES.START
  );
  const endNodes = nodes.filter(
    (node) => normalizeNodeType(node.type) === NODE_TYPES.END
  );

  if (startNodes.length === 0) {
    return { ok: false, message: "Workflow needs exactly one Start node." };
  }

  if (startNodes.length > 1) {
    return { ok: false, message: "Workflow can only have one Start node." };
  }

  const inDegree = computeInDegree(nodes, edges);
  if ((inDegree.get(startNodes[0].id) ?? 0) > 0) {
    return { ok: false, message: "Start node cannot have incoming edges." };
  }

  if (endNodes.length === 0) {
    return { ok: false, message: "Workflow needs at least one End node." };
  }

  try {
    const topologicalOrder = topologicalSort(nodes, edges);
    return { ok: true, topologicalOrder };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Workflow graph is invalid.",
    };
  }
}
