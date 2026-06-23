import BaseNode, { SourceHandle, TargetHandle } from "./BaseNode.jsx";

export default function DecisionNode({ data, selected }) {
  return (
    <BaseNode
      selected={selected}
      executionStatus={data.executionStatus}
      className="workflow-node--decision"
      handles={
        <>
          <TargetHandle />
          <SourceHandle id="true" className="workflow-handle--true" />
          <SourceHandle id="false" className="workflow-handle--false" />
        </>
      }
    >
      <div className="workflow-node__badge">DECISION</div>
      <div className="workflow-node__label">{data.label}</div>
      <div className="workflow-node__handles-labels">
        <span>True</span>
        <span>False</span>
      </div>
    </BaseNode>
  );
}
