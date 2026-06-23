import { buildAdjacency } from "./dag.js";

/**
 * @param {import('./dag.js').NodeLike[]} nodes
 * @param {import('./dag.js').EdgeLike[]} edges
 * @returns {Map<string, number>}
 */
export function computeInDegree(nodes, edges) {
  const inDegree = new Map();

  for (const node of nodes) {
    inDegree.set(String(node.id), 0);
  }

  for (const edge of edges) {
    const target = String(edge.target);
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
  }

  return inDegree;
}

export class CycleError extends Error {
  constructor() {
    super("Graph contains a cycle — cannot compute execution order.");
    this.name = "CycleError";
  }
}

/**
 * Kahn's algorithm — returns node ids in a valid execution order.
 * Time: O(V + E), Space: O(V)
 *
 * @param {import('./dag.js').NodeLike[]} nodes
 * @param {import('./dag.js').EdgeLike[]} edges
 * @returns {string[]}
 */
export function topologicalSort(nodes, edges) {
  const inDegree = computeInDegree(nodes, edges);
  const adj = buildAdjacency(nodes, edges);
  const queue = [];

  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);

    for (const next of adj.get(current) ?? []) {
      const updated = inDegree.get(next) - 1;
      inDegree.set(next, updated);
      if (updated === 0) queue.push(next);
    }
  }

  if (order.length !== nodes.length) {
    throw new CycleError();
  }

  return order;
}
