// Thin progress bar at the top of the page. It stays invisible for the
// first 300ms, so fast page loads show nothing at all and only slower
// ones (e.g. a database cold start) get a loading hint.
export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
      style={{ animation: "loading-appear 0s linear 300ms both" }}
    >
      <div
        className="h-full w-1/3 bg-primary"
        style={{ animation: "loading-slide 1.2s ease-in-out infinite" }}
      />

      <style>{`
        @keyframes loading-appear {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
