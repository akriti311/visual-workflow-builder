import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

/* Initial nodes */
const defaultNodes = [
  { id: "1", position: { x: 100, y: 100 }, data: { label: "API Node" } },
  { id: "2", position: { x: 400, y: 200 }, data: { label: "Database Node" } },
];

/* Initial edges */
const defaultEdges = [{ id: "e1-2", source: "1", target: "2" }];

let nodeId = 3;

/* Custom node component */
const CustomNode = ({ id, data, selected }) => {
  return (
    <div className={`custom-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Top} />

      <input
        value={data.label}
        onChange={(e) => data.onChange(id, e.target.value)}
        className="node-input"
      />

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const savedFlow = JSON.parse(localStorage.getItem("workflow"));

  const [nodes, setNodes, onNodesChange] = useNodesState(
    savedFlow?.nodes || defaultNodes
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    savedFlow?.edges || defaultEdges
  );

  const [selectedNode, setSelectedNode] = useState(null);

  /* Save to localStorage whenever nodes or edges change */
  useEffect(() => {
    localStorage.setItem("workflow", JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  /* Connect two nodes */
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  /* Add new node */
  const addNewNode = () => {
    const newNode = {
      id: String(nodeId++),
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Node ${nodeId}` },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  /* Vertical layout */
  const applyVerticalLayout = () => {
    const spacingY = 120;
    const startX = 300;

    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: startX,
        y: index * spacingY,
      },
    }));

    setNodes(updatedNodes);
  };

  /* Horizontal layout */
  const applyHorizontalLayout = () => {
    const spacingX = 200;
    const startY = 200;

    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: index * spacingX,
        y: startY,
      },
    }));

    setNodes(updatedNodes);
  };

  /* Circular layout */
  const applyCircularLayout = () => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    const updatedNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;

      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    setNodes(updatedNodes);
  };

  /* Update node label */
  const updateNodeLabel = (id, newLabel) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  };

  /* Delete selected node */
  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode));

    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode && edge.target !== selectedNode
      )
    );

    setSelectedNode(null);
  };

  /* Clear everything */
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem("workflow");
  };

  const nodesWithHandlers = nodes.map((node) => ({
    ...node,
    type: "custom",
    data: { ...node.data, onChange: updateNodeLabel },
  }));

  return (
    <div className={`app-container ${theme}`}>
      <div className="header">
        <h2>Workflow Builder</h2>

        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="toolbar">
        <button onClick={addNewNode}>Add</button>

        {/* Layout dropdown */}
        <div className="dropdown">
          <button onClick={() => setShowLayoutMenu(!showLayoutMenu)}>
            Layout
          </button>

          {showLayoutMenu && (
            <div className="dropdown-menu">
              <div
                onClick={() => {
                  applyVerticalLayout();
                  setShowLayoutMenu(false);
                }}
              >
                Vertical
              </div>

              <div
                onClick={() => {
                  applyHorizontalLayout();
                  setShowLayoutMenu(false);
                }}
              >
                Horizontal
              </div>

              <div
                onClick={() => {
                  applyCircularLayout();
                  setShowLayoutMenu(false);
                }}
              >
                Circular
              </div>
            </div>
          )}
        </div>

        <button onClick={deleteSelectedNode}>Delete</button>
        <button onClick={clearCanvas}>Clear</button>
      </div>

      <div className="flow-container">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          nodeTypes={{ custom: CustomNode }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => setSelectedNode(node.id)}
          fitView
        >
          <Background gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}