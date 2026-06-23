import { useCallback, useRef, useState } from "react";
import { executeWorkflow, resetLogCounter } from "../engine/executor.js";
import { validateWorkflowForExecution } from "../engine/validateWorkflow.js";

/** @typedef {'idle' | 'running' | 'completed' | 'error'} ExecutionStatus */

/**
 * @param {{
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 *   setNodes: import('react').Dispatch<import('react').SetStateAction<import('@xyflow/react').Node[]>>,
 *   onError: (message: string) => void,
 * }} params
 */
export function useExecution({ nodes, edges, setNodes, onError }) {
  const [status, setStatus] = useState(/** @type {ExecutionStatus} */ ("idle"));
  const [logs, setLogs] = useState(/** @type {import('../engine/executor.js').ExecutionLogEntry[]} */ ([]));
  const [topologicalOrder, setTopologicalOrder] = useState(/** @type {string[]} */ ([]));
  const abortRef = useRef(false);

  const setNodeExecutionStatus = useCallback(
    (nodeId, executionStatus) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, executionStatus } }
            : node
        )
      );
    },
    [setNodes]
  );

  const clearExecutionVisuals = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, executionStatus: "idle" },
      }))
    );
  }, [setNodes]);

  const reset = useCallback(() => {
    abortRef.current = true;
    clearExecutionVisuals();
    setLogs([]);
    setTopologicalOrder([]);
    setStatus("idle");
    resetLogCounter();
  }, [clearExecutionVisuals]);

  const run = useCallback(async () => {
    const validation = validateWorkflowForExecution(nodes, edges);
    if (!validation.ok) {
      onError(validation.message);
      setStatus("error");
      return;
    }

    abortRef.current = false;
    resetLogCounter();
    clearExecutionVisuals();
    setLogs([]);
    setTopologicalOrder(validation.topologicalOrder);
    setStatus("running");
    onError(null);

    const executedIds = new Set();

    try {
      await executeWorkflow(
        { nodes, edges },
        {
          shouldAbort: () => abortRef.current,
          onNodeStart: async (node) => {
            executedIds.add(node.id);
            setNodeExecutionStatus(node.id, "running");
          },
          onNodeComplete: async (node) => {
            setNodeExecutionStatus(node.id, "completed");
          },
          onNodeSkip: async (node) => {
            setNodeExecutionStatus(node.id, "skipped");
          },
          onLog: (entry) => {
            setLogs((prev) => [...prev, entry]);
          },
        }
      );

      if (!abortRef.current) {
        setStatus("completed");
      }
    } catch (error) {
      if (abortRef.current) {
        setStatus("idle");
        return;
      }

      const message =
        error instanceof Error ? error.message : "Workflow execution failed.";
      onError(message);
      setStatus("error");

      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            executionStatus: executedIds.has(node.id)
              ? node.data.executionStatus
              : "idle",
          },
        }))
      );
    }
  }, [
    clearExecutionVisuals,
    edges,
    nodes,
    onError,
    setNodeExecutionStatus,
    setNodes,
  ]);

  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    status,
    logs,
    topologicalOrder,
    run,
    reset,
    stop,
    isRunning: status === "running",
  };
}

/**
 * @param {import('@xyflow/react').Node} node
 */
export function getExecutionStatusLabel(node) {
  const status = node.data?.executionStatus;
  if (!status || status === "idle") return null;
  return String(status).toUpperCase();
}
