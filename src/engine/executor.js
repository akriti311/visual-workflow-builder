import { normalizeNodeType, NODE_TYPES } from "../constants/nodeTypes.js";
import { evaluateCondition } from "./evaluateCondition.js";

/** @typedef {'start' | 'complete' | 'decision' | 'skip' | 'error'} LogEvent */

/**
 * @typedef {{
 *   id: string,
 *   timestamp: number,
 *   nodeId: string,
 *   nodeLabel: string,
 *   nodeType: string,
 *   event: LogEvent,
 *   message: string,
 *   orderIndex: number,
 * }} ExecutionLogEntry
 */

let logCounter = 0;

/**
 * @param {{
 *   nodeId: string,
 *   nodeLabel: string,
 *   nodeType: string,
 *   event: LogEvent,
 *   message: string,
 *   orderIndex: number,
 * }} params
 * @returns {ExecutionLogEntry}
 */
export function createLogEntry(params) {
  logCounter += 1;
  return {
    id: `log-${logCounter}`,
    timestamp: Date.now(),
    ...params,
  };
}

export function resetLogCounter() {
  logCounter = 0;
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * @param {import('@xyflow/react').Node[]} nodes
 * @param {import('@xyflow/react').Edge[]} edges
 */
function buildOutgoingEdges(nodes, edges) {
  const map = new Map();

  for (const node of nodes) {
    map.set(node.id, []);
  }

  for (const edge of edges) {
    const list = map.get(edge.source) ?? [];
    list.push(edge);
    map.set(edge.source, list);
  }

  return map;
}

/**
 * @param {import('@xyflow/react').Node[]} nodes
 * @param {import('@xyflow/react').Edge[]} edges
 */
function buildInDegree(nodes, edges) {
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  return inDegree;
}

/**
 * @param {import('@xyflow/react').Node} node
 */
function getStepDelayMs(node) {
  const type = normalizeNodeType(node.type);
  if (type === NODE_TYPES.PROCESS) {
    const duration = Number(node.data?.config?.durationMs ?? 1000);
    return Number.isFinite(duration) ? Math.max(0, duration) : 1000;
  }
  return 600;
}

/**
 * Execute workflow from Start using queue-based traversal.
 * Decision nodes follow only the chosen branch.
 *
 * @param {{
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 * }} graph
 * @param {{
 *   onNodeStart: (node: import('@xyflow/react').Node, orderIndex: number) => void | Promise<void>,
 *   onNodeComplete: (node: import('@xyflow/react').Node, orderIndex: number) => void | Promise<void>,
 *   onLog: (entry: ExecutionLogEntry) => void,
 *   onNodeSkip?: (node: import('@xyflow/react').Node) => void | Promise<void>,
 *   shouldAbort?: () => boolean,
 * }} hooks
 */
export async function executeWorkflow(graph, hooks) {
  const { nodes, edges } = graph;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = buildOutgoingEdges(nodes, edges);
  const pendingInDegree = buildInDegree(nodes, edges);

  const startNode = nodes.find(
    (node) => normalizeNodeType(node.type) === NODE_TYPES.START
  );
  if (!startNode) {
    throw new Error("Start node not found.");
  }

  const queue = [startNode.id];
  const enqueued = new Set([startNode.id]);
  const executed = new Set();
  let orderIndex = 0;

  while (queue.length > 0) {
    if (hooks.shouldAbort?.()) {
      throw new Error("Execution stopped.");
    }

    const nodeId = queue.shift();
    if (executed.has(nodeId)) continue;

    const node = nodeById.get(nodeId);
    if (!node) continue;

    executed.add(nodeId);
    const nodeType = normalizeNodeType(node.type);
    const nodeLabel = node.data?.label ?? nodeId;

    await hooks.onNodeStart(node, orderIndex);
    hooks.onLog(
      createLogEntry({
        nodeId,
        nodeLabel,
        nodeType,
        event: "start",
        message: `Started "${nodeLabel}" (${nodeType})`,
        orderIndex,
      })
    );

    await sleep(getStepDelayMs(node));

    if (hooks.shouldAbort?.()) {
      throw new Error("Execution stopped.");
    }

    await hooks.onNodeComplete(node, orderIndex);
    hooks.onLog(
      createLogEntry({
        nodeId,
        nodeLabel,
        nodeType,
        event: "complete",
        message: `Completed "${nodeLabel}"`,
        orderIndex,
      })
    );

    orderIndex += 1;

    if (nodeType === NODE_TYPES.END) {
      continue;
    }

    const outEdges = outgoing.get(nodeId) ?? [];
    let nextEdges = outEdges;

    if (nodeType === NODE_TYPES.DECISION) {
      const condition = node.data?.config?.condition ?? "";
      const result = evaluateCondition(condition);
      const handleId = result ? "true" : "false";
      const chosen =
        outEdges.find((edge) => edge.sourceHandle === handleId) ??
        outEdges.find((edge) => (edge.sourceHandle ?? "true") === handleId) ??
        outEdges[0];

      nextEdges = chosen ? [chosen] : [];

      hooks.onLog(
        createLogEntry({
          nodeId,
          nodeLabel,
          nodeType,
          event: "decision",
          message: `Condition "${condition || "(empty)"}" → ${result ? "TRUE" : "FALSE"}${
            chosen ? ` → next: ${nodeById.get(chosen.target)?.data?.label ?? chosen.target}` : ""
          }`,
          orderIndex: orderIndex - 1,
        })
      );
    }

    for (const edge of nextEdges) {
      const nextId = edge.target;
      pendingInDegree.set(nextId, (pendingInDegree.get(nextId) ?? 1) - 1);

      if ((pendingInDegree.get(nextId) ?? 0) === 0 && !enqueued.has(nextId)) {
        queue.push(nextId);
        enqueued.add(nextId);
      }
    }
  }

  for (const node of nodes) {
    if (!executed.has(node.id)) {
      await hooks.onNodeSkip?.(node);
      hooks.onLog(
        createLogEntry({
          nodeId: node.id,
          nodeLabel: node.data?.label ?? node.id,
          nodeType: normalizeNodeType(node.type),
          event: "skip",
          message: `Skipped "${node.data?.label ?? node.id}" (not on execution path)`,
          orderIndex: -1,
        })
      );
    }
  }
}
