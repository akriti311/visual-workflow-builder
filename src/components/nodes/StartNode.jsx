import BaseNode, { SourceHandle } from "./BaseNode.jsx";

export default function StartNode({ data, selected }) {
  return (
    <BaseNode
      selected={selected}
      executionStatus={data.executionStatus}
      className="workflow-node--start" handles={<SourceHandle />}>
      <div className="workflow-node__badge">START</div>
      <div className="workflow-node__label">{data.label}</div>
    </BaseNode>
  );
}
