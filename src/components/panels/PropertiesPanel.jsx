import { getNodeTypeLabel, normalizeNodeType } from "../../constants/nodeTypes.js";

/**
 * @param {{
 *   node: import('@xyflow/react').Node | null,
 *   onUpdate: (nodeId: string, patch: { label?: string, config?: Record<string, unknown> }) => void,
 *   onEditStart: () => void,
 * }} props
 */
export default function PropertiesPanel({ node, onUpdate, onEditStart, disabled = false }) {
  if (!node) {
    return (
      <div className="properties-panel properties-panel--empty">
        <h3>Properties</h3>
        <p className="properties-panel__hint">Select a node to edit its metadata.</p>
      </div>
    );
  }

  const type = normalizeNodeType(node.type);
  const config = node.data?.config ?? {};

  const updateLabel = (label) => onUpdate(node.id, { label });
  const updateConfig = (key, value) =>
    onUpdate(node.id, { config: { ...config, [key]: value } });

  return (
    <div className="properties-panel">
      <h3>Properties</h3>

      <div className="properties-panel__section">
        <span className="properties-panel__type">{getNodeTypeLabel(node)}</span>
        <span className="properties-panel__id">ID: {node.id}</span>
      </div>

      <label className="properties-field">
        <span>Label</span>
        <input
          type="text"
          value={node.data?.label ?? ""}
          disabled={disabled}
          onFocus={onEditStart}
          onChange={(e) => updateLabel(e.target.value)}
        />
      </label>

      {(type === "process" || type === "decision") && (
        <label className="properties-field">
          <span>Description</span>
          <textarea
            rows={3}
            disabled={disabled}
            value={config.description ?? ""}
            onFocus={onEditStart}
            onChange={(e) => updateConfig("description", e.target.value)}
          />
        </label>
      )}

      {type === "process" && (
        <label className="properties-field">
          <span>Duration (ms)</span>
          <input
            type="number"
            min={0}
            step={100}
            disabled={disabled}
            value={config.durationMs ?? 1000}
            onFocus={onEditStart}
            onChange={(e) => updateConfig("durationMs", Number(e.target.value))}
          />
        </label>
      )}

      {type === "decision" && (
        <label className="properties-field">
          <span>Condition</span>
          <input
            type="text"
            placeholder="e.g. stock > 0"
            disabled={disabled}
            value={config.condition ?? ""}
            onFocus={onEditStart}
            onChange={(e) => updateConfig("condition", e.target.value)}
          />
        </label>
      )}

      {(type === "start" || type === "end") && (
        <label className="properties-field">
          <span>Description</span>
          <textarea
            rows={2}
            disabled={disabled}
            value={config.description ?? ""}
            onFocus={onEditStart}
            onChange={(e) => updateConfig("description", e.target.value)}
          />
        </label>
      )}
    </div>
  );
}
