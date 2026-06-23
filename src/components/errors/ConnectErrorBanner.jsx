export default function ConnectErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="connect-error" role="alert">
      <div className="connect-error__text">{message}</div>
      <button
        className="connect-error__dismiss"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
