import { useEffect } from "react";

/**
 * @param {{
 *   onUndo: () => void,
 *   onRedo: () => void,
 *   enabled?: boolean,
 * }} params
 */
export function useKeyboardShortcuts({ onUndo, onRedo, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;

      const key = event.key.toLowerCase();

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        onUndo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onUndo, onRedo]);
}
