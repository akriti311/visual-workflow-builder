import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";
import { defaultEdges, defaultNodes, getNextNodeId } from "../constants/defaults.js";
import {
  createWorkflowNode,
  normalizeNodeType,
} from "../constants/nodeTypes.js";
import { useUndoRedo } from "../history/useUndoRedo.js";
import { validateDagEdgeAdd } from "../graph/dag.js";
import {
  connectionFromState,
  getConnectErrorMessage,
} from "../graph/connectUtils.js";
import { AUTOSAVE_DEBOUNCE_MS, STORAGE_KEY } from "../persistence/workflowSchema.js";
import { serializeWorkflow } from "../persistence/serialize.js";
import {
  exportWorkflowToFile,
  importWorkflowFromFile,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "../persistence/storage.js";

/**
 * Central workflow state: graph editing, DAG validation, persistence, undo/redo.
 */
export function useWorkflow() {
  const saved = loadFromLocalStorage();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    saved?.nodes ?? defaultNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    saved?.edges ?? defaultEdges
  );
  const [metadata, setMetadata] = useState(
    saved?.metadata ?? {
      name: "Untitled Workflow",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [importError, setImportError] = useState(null);

  const edgesRef = useRef(edges);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const { recordHistory, undo, redo, canUndo, canRedo } =
    useUndoRedo({ nodes, edges, setNodes, setEdges });

  const withHistory = useCallback(
    (action) => {
      recordHistory();
      action();
    },
    [recordHistory]
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  /* Debounced auto-save */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const document = serializeWorkflow({
        nodes,
        edges,
        metadata: { ...metadata, updatedAt: new Date().toISOString() },
      });
      saveToLocalStorage(document);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [nodes, edges, metadata]);

  const isValidConnection = useCallback(
    (connection) =>
      validateDagEdgeAdd({ nodes, edges: edgesRef.current }, connection).ok,
    [nodes]
  );

  const onConnectEnd = useCallback(
    (_event, connectionState) => {
      if (connectionState.isValid !== false) return;

      const connection = connectionFromState(connectionState);
      if (!connection) return;

      const result = validateDagEdgeAdd(
        { nodes, edges: edgesRef.current },
        connection
      );
      if (!result.ok) {
        setConnectError(getConnectErrorMessage(result.reason));
      }
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params) => {
      withHistory(() => {
        setConnectError(null);
        setEdges((eds) => addEdge(params, eds));
      });
    },
    [setEdges, withHistory]
  );

  const addNode = useCallback(
    (type) => {
      withHistory(() => {
        const id = getNextNodeId(nodes);
        setNodes((nds) => [
          ...nds,
          createWorkflowNode(normalizeNodeType(type), id, {
            x: 120 + Math.random() * 360,
            y: 80 + Math.random() * 320,
          }),
        ]);
      });
    },
    [nodes, setNodes, withHistory]
  );

  const updateNodeData = useCallback(
    (id, patch) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== id) return node;

          return {
            ...node,
            data: {
              ...node.data,
              ...(patch.label != null ? { label: patch.label } : {}),
              ...(patch.config
                ? { config: { ...node.data.config, ...patch.config } }
                : {}),
            },
          };
        })
      );
    },
    [setNodes]
  );

  const onPropertiesEditStart = useCallback(() => {
    recordHistory();
  }, [recordHistory]);

  const onNodeDragStart = useCallback(() => {
    recordHistory();
  }, [recordHistory]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    withHistory(() => {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNodeId && edge.target !== selectedNodeId
        )
      );
      setSelectedNodeId(null);
    });
  }, [selectedNodeId, setEdges, setNodes, withHistory]);

  const applyLayout = useCallback(
    (layoutFn) => {
      withHistory(() => {
        setNodes((nds) => layoutFn(nds));
      });
    },
    [setNodes, withHistory]
  );

  const applyVerticalLayout = useCallback(() => {
    applyLayout((nds) => {
      const spacingY = 140;
      const startX = 300;
      return nds.map((node, index) => ({
        ...node,
        position: { x: startX, y: index * spacingY },
      }));
    });
  }, [applyLayout]);

  const applyHorizontalLayout = useCallback(() => {
    applyLayout((nds) => {
      const spacingX = 220;
      const startY = 200;
      return nds.map((node, index) => ({
        ...node,
        position: { x: index * spacingX, y: startY },
      }));
    });
  }, [applyLayout]);

  const applyCircularLayout = useCallback(() => {
    applyLayout((nds) => {
      const centerX = 400;
      const centerY = 300;
      const radius = 200;
      return nds.map((node, index) => {
        const angle = (index / nds.length) * 2 * Math.PI;
        return {
          ...node,
          position: {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          },
        };
      });
    });
  }, [applyLayout]);

  const clearCanvas = useCallback(() => {
    withHistory(() => {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setConnectError(null);
      setMetadata({
        name: "Untitled Workflow",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    localStorage.removeItem(STORAGE_KEY);
  }, [setEdges, setNodes, withHistory]);

  const exportWorkflow = useCallback(() => {
    exportWorkflowToFile({ nodes, edges, metadata });
  }, [edges, metadata, nodes]);

  const importWorkflow = useCallback(async () => {
    try {
      setImportError(null);
      const document = await importWorkflowFromFile();
      recordHistory();
      setNodes(document.nodes);
      setEdges(document.edges);
      setMetadata(document.metadata);
      setSelectedNodeId(null);
      setConnectError(null);
      saveToLocalStorage(document);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to import workflow."
      );
    }
  }, [recordHistory, setEdges, setNodes]);

  return {
    nodes,
    edges,
    metadata,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    setNodes,
    connectError,
    setConnectError,
    importError,
    setImportError,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    isValidConnection,
    onNodeDragStart,
    addNode,
    updateNodeData,
    onPropertiesEditStart,
    deleteSelectedNode,
    applyVerticalLayout,
    applyHorizontalLayout,
    applyCircularLayout,
    clearCanvas,
    exportWorkflow,
    importWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
