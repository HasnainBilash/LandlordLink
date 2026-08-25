export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm">
      <div className="relative h-8 w-64 overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-muted-foreground/30" />

        <div
          className="absolute top-1/2 text-3xl"
          style={{ animation: "snail-crawl 5s ease-in-out infinite" }}
        >
          🐌
        </div>
      </div>

      <p
        className="text-sm font-medium text-muted-foreground"
        style={{ animation: "loading-pulse 1.8s ease-in-out infinite" }}
      >
        Loading…
      </p>

      <style>{`
        @keyframes snail-crawl {
          0%   { left: -10%; opacity: 0; transform: translateY(-50%) rotate(0deg); }
          8%   { opacity: 1; }
          20%  { transform: translateY(-50%) rotate(-4deg); }
          30%  { transform: translateY(-50%) rotate(3deg); }
          40%  { transform: translateY(-50%) rotate(-3deg); }
          50%  { left: calc(100% - 2rem); transform: translateY(-50%) rotate(0deg); }
          58%  { opacity: 1; left: calc(100% - 2rem); }
          60%  { opacity: 0; left: calc(100% - 2rem); }
          100% { left: -10%; opacity: 0; }
        }

        @keyframes loading-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
