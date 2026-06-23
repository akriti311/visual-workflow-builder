/**
 * @param {'self_loop' | 'cycle'} reason
 */
export function getConnectErrorMessage(reason) {
  return reason === "self_loop"
    ? "Invalid connection: a node cannot connect to itself."
    : "Invalid connection: this edge would create a cycle.";
}

/**
 * @param {import('@xyflow/system').FinalConnectionState} connectionState
 */
export function connectionFromState(connectionState) {
  if (!connectionState.fromNode || !connectionState.toHandle) return null;

  const fromId = connectionState.fromNode.id;
  const toId = connectionState.toHandle.nodeId;

  return connectionState.fromHandle?.type === "source"
    ? { source: fromId, target: toId }
    : { source: toId, target: fromId };
}
