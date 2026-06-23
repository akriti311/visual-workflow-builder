import { useState } from "react";
import { NODE_TYPES } from "../../constants/nodeTypes.js";

const ADD_NODE_OPTIONS = [
  { type: NODE_TYPES.START, label: "Start" },
  { type: NODE_TYPES.PROCESS, label: "Process" },
  { type: NODE_TYPES.DECISION, label: "Decision" },
  { type: NODE_TYPES.END, label: "End" },
];

export default function Toolbar({
  onAddNode,
  onDelete,
  onClear,
  onExport,
  onImport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRun,
  onStop,
  onResetExecution,
  isRunning,
  onVerticalLayout,
  onHorizontalLayout,
  onCircularLayout,
}) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="toolbar">
      <div className="dropdown">
        <button type="button" onClick={() => setShowAddMenu(!showAddMenu)}>
          Add Node
        </button>

        {showAddMenu && (
          <div className="dropdown-menu">
            {ADD_NODE_OPTIONS.map((option) => (
              <div
                key={option.type}
                onClick={() => {
                  onAddNode(option.type);
                  setShowAddMenu(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        Redo
      </button>

      <button
        type="button"
        className="run-button"
        onClick={onRun}
        disabled={isRunning}
        title="Run workflow simulation"
      >
        Run
      </button>
      {isRunning && (
        <button type="button" className="stop-button" onClick={onStop}>
          Stop
        </button>
      )}
      <button type="button" className="reset-button" onClick={onResetExecution} disabled={isRunning}>
        Reset Run
      </button>

      <button type="button" onClick={onExport}>
        Export
      </button>
      <button type="button" onClick={onImport}>
        Import
      </button>

      <div className="dropdown">
        <button type="button" onClick={() => setShowLayoutMenu(!showLayoutMenu)}>
          Layout
        </button>

        {showLayoutMenu && (
          <div className="dropdown-menu">
            <div
              onClick={() => {
                onVerticalLayout();
                setShowLayoutMenu(false);
              }}
            >
              Vertical
            </div>
            <div
              onClick={() => {
                onHorizontalLayout();
                setShowLayoutMenu(false);
              }}
            >
              Horizontal
            </div>
            <div
              onClick={() => {
                onCircularLayout();
                setShowLayoutMenu(false);
              }}
            >
              Circular
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={onDelete}>
        Delete
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
