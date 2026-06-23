import { NODE_TYPES } from "./nodeTypes.js";

export const defaultNodes = [
  {
    id: "1",
    type: NODE_TYPES.START,
    position: { x: 280, y: 60 },
    data: {
      label: "Start",
      config: { description: "Workflow entry point" },
    },
  },
  {
    id: "2",
    type: NODE_TYPES.PROCESS,
    position: { x: 280, y: 200 },
    data: {
      label: "Process",
      config: { description: "Run a task", durationMs: 1000 },
    },
  },
  {
    id: "3",
    type: NODE_TYPES.END,
    position: { x: 280, y: 360 },
    data: {
      label: "End",
      config: { description: "Workflow exit point" },
    },
  },
];

export const defaultEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

/**
 * @param {import('@xyflow/react').Node[]} nodes
 */
export function getNextNodeId(nodes) {
  const numericIds = nodes
    .map((node) => Number.parseInt(node.id, 10))
    .filter((id) => !Number.isNaN(id));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return String(maxId + 1);
}
