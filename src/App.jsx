import { useState } from "react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import WorkflowCanvas from "./components/canvas/WorkflowCanvas.jsx";
import ConnectErrorBanner from "./components/errors/ConnectErrorBanner.jsx";
import ExecutionLogPanel from "./components/panels/ExecutionLogPanel.jsx";
import PropertiesPanel from "./components/panels/PropertiesPanel.jsx";
import Toolbar from "./components/toolbar/Toolbar.jsx";
import { useExecution } from "./hooks/useExecution.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { useWorkflow } from "./hooks/useWorkflow.js";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const workflow = useWorkflow();

  const execution = useExecution({
    nodes: workflow.nodes,
    edges: workflow.edges,
    setNodes: workflow.setNodes,
    onError: (message) => {
      if (message) workflow.setConnectError(message);
      else workflow.setConnectError(null);
    },
  });

  useKeyboardShortcuts({
    onUndo: workflow.undo,
    onRedo: workflow.redo,
    enabled: !execution.isRunning,
  });

  const bannerMessage = workflow.connectError ?? workflow.importError;

  return (
    <div className={`app-container ${theme}`}>
      <div className="header">
        <h2>Workflow Builder</h2>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <Toolbar
        onAddNode={workflow.addNode}
        onDelete={workflow.deleteSelectedNode}
        onClear={workflow.clearCanvas}
        onExport={workflow.exportWorkflow}
        onImport={workflow.importWorkflow}
        onUndo={workflow.undo}
        onRedo={workflow.redo}
        canUndo={workflow.canUndo}
        canRedo={workflow.canRedo}
        onRun={execution.run}
        onStop={execution.stop}
        onResetExecution={execution.reset}
        isRunning={execution.isRunning}
        onVerticalLayout={workflow.applyVerticalLayout}
        onHorizontalLayout={workflow.applyHorizontalLayout}
        onCircularLayout={workflow.applyCircularLayout}
      />

      <ConnectErrorBanner
        message={bannerMessage}
        onDismiss={() => {
          workflow.setConnectError(null);
          workflow.setImportError(null);
        }}
      />

      <div className="workspace">
        <WorkflowCanvas
          nodes={workflow.nodes}
          edges={workflow.edges}
          isRunning={execution.isRunning}
          onNodesChange={workflow.onNodesChange}
          onEdgesChange={workflow.onEdgesChange}
          onConnect={workflow.onConnect}
          onConnectEnd={workflow.onConnectEnd}
          isValidConnection={workflow.isValidConnection}
          onNodeClick={(_event, node) => workflow.setSelectedNodeId(node.id)}
          onPaneClick={() => workflow.setSelectedNodeId(null)}
          onNodeDragStart={workflow.onNodeDragStart}
        />

        <aside className="sidebar">
          <PropertiesPanel
            node={workflow.selectedNode}
            onUpdate={workflow.updateNodeData}
            onEditStart={workflow.onPropertiesEditStart}
            disabled={execution.isRunning}
          />

          <ExecutionLogPanel
            logs={execution.logs}
            status={execution.status}
            topologicalOrder={execution.topologicalOrder}
          />
        </aside>
      </div>
    </div>
  );
}
