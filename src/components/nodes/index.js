import DecisionNode from "./DecisionNode.jsx";
import EndNode from "./EndNode.jsx";
import ProcessNode from "./ProcessNode.jsx";
import StartNode from "./StartNode.jsx";

export const workflowNodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
};
