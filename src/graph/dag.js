/**
 * Small, framework-agnostic DAG utilities.
 *
 * Design goal: keep this reusable for (a) validation at edit-time and
 * (b) workflow execution (topological sort) later.
 */

/**
 * @typedef {{ id: string }} NodeLike
 * @typedef {{ source: string, target: string }} EdgeLike
 */

/**
 * Build an adjacency list (outgoing edges) from nodes + edges.
 *
 * @param {NodeLike[]} nodes
 * @param {EdgeLike[]} edges
 * @returns {Map<string, string[]>} fromNodeId -> [toNodeId...]
 */
export function buildAdjacency(nodes, edges) {
  const adj = new Map();

  for (const n of nodes) adj.set(String(n.id), []);

  for (const e of edges) {
    const from = String(e.source);
    const to = String(e.target);

    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);

    if (!adj.has(to)) adj.set(to, []);
  }

  return adj;
}

/**
 * Check if there is a path from `start` to `goal` in a directed graph.
 * Iterative DFS to avoid recursion depth issues on large graphs.
 *
 * @param {Map<string, string[]>} adj
 * @param {string} start
 * @param {string} goal
 * @returns {boolean}
 */
export function hasPath(adj, start, goal) {
  if (start === goal) return true;

  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === goal) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);

    const next = adj.get(cur);
    if (!next || next.length === 0) continue;

    for (let i = 0; i < next.length; i++) {
      const n = next[i];
      if (!visited.has(n)) stack.push(n);
    }
  }

  return false;
}

/**
 * Incremental cycle test for adding one edge (u -> v).
 *
 * Adding u -> v creates a cycle iff v can already reach u.
 *
 * @param {{ nodes: NodeLike[], edges: EdgeLike[] }} graph
 * @param {{ source: string, target: string }} candidateEdge
 * @returns {{ ok: true } | { ok: false, reason: 'self_loop' | 'cycle' }}
 */
export function validateDagEdgeAdd(graph, candidateEdge) {
  const u = String(candidateEdge.source);
  const v = String(candidateEdge.target);

  if (u === v) return { ok: false, reason: "self_loop" };

  const adj = buildAdjacency(graph.nodes, graph.edges);
  const cycle = hasPath(adj, v, u);
  if (cycle) return { ok: false, reason: "cycle" };

  return { ok: true };
}

/**
 * Replay edges in order and keep only those that preserve a DAG.
 * Useful when loading persisted graphs that may contain cycles.
 *
 * @param {NodeLike[]} nodes
 * @param {EdgeLike[]} edges
 * @returns {EdgeLike[]}
 */
export function sanitizeEdgesToDag(nodes, edges) {
  const kept = [];

  for (const edge of edges) {
    const result = validateDagEdgeAdd(
      { nodes, edges: kept },
      { source: edge.source, target: edge.target }
    );
    if (result.ok) kept.push(edge);
  }

  return kept;
}

