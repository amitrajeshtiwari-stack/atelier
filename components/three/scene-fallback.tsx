/** Static gradient that stands in for any 3D scene — skeleton, no-WebGL
 * fallback and reduced-motion fallback all share it, so nothing pops. */
export function SceneFallback({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`grain relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 20% 10%, var(--canvas-top) 0%, transparent 55%),
          radial-gradient(100% 80% at 85% 85%, var(--accent-soft) 0%, transparent 60%),
          linear-gradient(160deg, var(--canvas-top) 0%, var(--canvas-bottom) 100%)`,
      }}
    />
  );
}
