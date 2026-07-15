"use client";

// Root-level crash screen. Renders outside the app's layout (and possibly
// without its CSS), so everything here is inline-styled and dependency-free.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060608",
          color: "#e4e4e7",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 32,
            border: "1px solid #27272a",
            borderRadius: 16,
            background: "#141416",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Franko OS hit a fatal error
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: "#a1a1aa" }}>
            The whole page crashed. Reload to get back to the desktop — nothing
            you saved is lost.
          </p>
          {error.digest && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#52525b", fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              background: "#10b981",
              color: "#06120d",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
