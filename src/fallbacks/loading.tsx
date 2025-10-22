export default function LoadingPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "80px",
          height: "80px",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "4px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            borderTopColor: "#ffffff",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
      <h2
        style={{
          color: "#ffffff",
          fontSize: "1.5rem",
          fontWeight: "600",
          margin: "0 0 0.5rem 0",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        Loading
      </h2>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "0.875rem",
          margin: 0,
        }}
      >
        Please wait while we load your content...
      </p>
    </div>
  );
}
