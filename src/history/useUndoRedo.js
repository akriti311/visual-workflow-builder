import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_HISTORY } from "../persistence/workflowSchema.js";

/** @typedef {{ nodes: import('@xyflow/react').Node[], edges: import('@xyflow/react').Edge[] }} WorkflowSnapshot */

/**
 * @param {WorkflowSnapshot} snapshot
 */
function cloneSnapshot(snapshot) {
  return {
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
    edges: JSON.parse(JSON.stringify(snapshot.edges)),
  };
}

/**
 * Snapshot-based undo/redo for workflow graph state.
 *
 * @param {{
 *   nodes: import('@xyflow/react').Node[],
 *   edges: import('@xyflow/react').Edge[],
 *   setNodes: import('react').Dispatch<import('react').SetStateAction<import('@xyflow/react').Node[]>>,
 *   setEdges: import('react').Dispatch<import('react').SetStateAction<import('@xyflow/react').Edge[]>>,
 * }} params
 */
export function useUndoRedo({ nodes, edges, setNodes, setEdges }) {
  const pastRef = useRef(/** @type {WorkflowSnapshot[]} */ ([]));
  const futureRef = useRef(/** @type {WorkflowSnapshot[]} */ ([]));
  const isRestoringRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const getCurrentSnapshot = useCallback(
    () => cloneSnapshot({ nodes: nodesRef.current, edges: edgesRef.current }),
    []
  );

  const applySnapshot = useCallback(
    (snapshot) => {
      isRestoringRef.current = true;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      queueMicrotask(() => {
        isRestoringRef.current = false;
      });
    },
    [setNodes, setEdges]
  );

  const recordHistory = useCallback(() => {
    if (isRestoringRef.current) return;

    pastRef.current = [...pastRef.current, getCurrentSnapshot()].slice(-MAX_HISTORY);
    futureRef.current = [];
    syncFlags();
  }, [getCurrentSnapshot, syncFlags]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const current = getCurrentSnapshot();
    const previous = pastRef.current.pop();
    if (!previous) return;

    futureRef.current.push(current);
    applySnapshot(previous);
    syncFlags();
  }, [applySnapshot, getCurrentSnapshot, syncFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const current = getCurrentSnapshot();
    const next = futureRef.current.pop();
    if (!next) return;

    pastRef.current.push(current);
    applySnapshot(next);
    syncFlags();
  }, [applySnapshot, getCurrentSnapshot, syncFlags]);

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncFlags();
  }, [syncFlags]);

  return {
    recordHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
}
