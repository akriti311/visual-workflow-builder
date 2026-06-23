import { Handle, Position } from "@xyflow/react";

/**
 * @param {{
 *   selected?: boolean,
 *   className: string,
 *   children: import('react').ReactNode,
 *   handles: import('react').ReactNode,
 * }} props
 */
export default function BaseNode({ selected, className, children, handles, executionStatus }) {
  const statusClass =
    executionStatus && executionStatus !== "idle"
      ? `workflow-node--${executionStatus}`
      : "";

  return (
    <div
      className={`workflow-node ${className} ${selected ? "selected" : ""} ${statusClass}`.trim()}
    >
      {handles}
      {children}
      {executionStatus && executionStatus !== "idle" && (
        <div className={`workflow-node__status workflow-node__status--${executionStatus}`}>
          {executionStatus}
        </div>
      )}
    </div>
  );
}

export function TargetHandle() {
  return <Handle type="target" position={Position.Top} className="workflow-handle" />;
}

export function SourceHandle({ id, className }) {
  return (
    <Handle
      type="source"
      position={Position.Bottom}
      id={id}
      className={`workflow-handle ${className ?? ""}`}
    />
  );
}
