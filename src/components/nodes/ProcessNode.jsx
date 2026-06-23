import BaseNode, { SourceHandle, TargetHandle } from "./BaseNode.jsx";

export default function ProcessNode({ data, selected }) {
  return (
    <BaseNode
      selected={selected}
      executionStatus={data.executionStatus}
      className="workflow-node--process"
      handles={
        <>
          <TargetHandle />
          <SourceHandle />
        </>
      }
    >
      <div className="workflow-node__badge">PROCESS</div>
      <div className="workflow-node__label">{data.label}</div>
    </BaseNode>
  );
}
