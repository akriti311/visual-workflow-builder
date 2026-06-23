import BaseNode, { TargetHandle } from "./BaseNode.jsx";

export default function EndNode({ data, selected }) {
  return (
    <BaseNode
      selected={selected}
      executionStatus={data.executionStatus}
      className="workflow-node--end" handles={<TargetHandle />}>
      <div className="workflow-node__badge">END</div>
      <div className="workflow-node__label">{data.label}</div>
    </BaseNode>
  );
}
