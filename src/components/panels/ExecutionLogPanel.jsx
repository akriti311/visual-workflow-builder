/**
 * @param {{
 *   logs: import('../engine/executor.js').ExecutionLogEntry[],
 *   status: string,
 *   topologicalOrder: string[],
 * }} props
 */
export default function ExecutionLogPanel({ logs, status, topologicalOrder }) {
  return (
    <section className="execution-log-panel">
      <div className="execution-log-panel__header">
        <h3>Execution Log</h3>
        <span className={`execution-status execution-status--${status}`}>
          {status}
        </span>
      </div>

      {topologicalOrder.length > 0 && (
        <div className="execution-log-panel__topo">
          <span className="execution-log-panel__topo-label">Topo order (Kahn&apos;s):</span>
          <span className="execution-log-panel__topo-value">
            {topologicalOrder.join(" → ")}
          </span>
        </div>
      )}

      <div className="execution-log-panel__list">
        {logs.length === 0 ? (
          <p className="execution-log-panel__empty">
            Click <strong>Run</strong> to simulate workflow execution.
          </p>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`execution-log-entry execution-log-entry--${entry.event}`}
            >
              <div className="execution-log-entry__meta">
                <span className="execution-log-entry__event">{entry.event}</span>
                {entry.orderIndex >= 0 && (
                  <span className="execution-log-entry__step">#{entry.orderIndex + 1}</span>
                )}
              </div>
              <div className="execution-log-entry__message">{entry.message}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
