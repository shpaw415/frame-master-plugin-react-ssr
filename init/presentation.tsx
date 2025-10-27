export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ededed",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Logo/Icon */}
      <div
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
          fontSize: "48px",
          fontWeight: "700",
          color: "white",
        }}
      >
        FM
      </div>

      {/* Main Heading */}
      <h1
        style={{
          fontSize: "56px",
          fontWeight: "700",
          margin: "0 0 16px 0",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        Get started with
        <br />
        <span style={{ color: "#3b82f6" }}>Frame-Master</span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "18px",
          color: "#a3a3a3",
          margin: "0 0 48px 0",
          textAlign: "center",
          maxWidth: "500px",
          lineHeight: "1.6",
        }}
      >
        Edit{" "}
        <code
          style={{
            background: "#1a1a1a",
            padding: "4px 8px",
            borderRadius: "6px",
            color: "#3b82f6",
            fontSize: "16px",
          }}
        >
          src/pages/index.tsx
        </code>{" "}
        and save to reload.
      </p>

      {/* Links Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          maxWidth: "900px",
          width: "100%",
          marginBottom: "64px",
        }}
      >
        {[
          {
            href: "https://github.com/shpaw415/frame-master",
            title: "Docs",
            desc: "Find in-depth information about Frame-Master features and API.",
            icon: "📖",
          },
          {
            href: "https://github.com/shpaw415/frame-master-plugin-react-ssr",
            title: "Learn",
            desc: "Learn about React SSR plugin in an interactive course!",
            icon: "🎓",
          },
          {
            href: "https://github.com/shpaw415/frame-master/examples",
            title: "Examples",
            desc: "Discover and deploy example Frame-Master projects.",
            icon: "🚀",
          },
          {
            href: "https://github.com/shpaw415/frame-master",
            title: "Deploy",
            desc: "Instantly deploy your Frame-Master site to production.",
            icon: "▲",
          },
        ].map((link, i) => (
          <a
            key={i}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "24px",
              background: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.background = "#1e1e1e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#262626";
              e.currentTarget.style.background = "#1a1a1a";
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "12px",
              }}
            >
              {link.icon}
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {link.title}
              <span style={{ fontSize: "14px", color: "#737373" }}>→</span>
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#737373",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {link.desc}
            </p>
          </a>
        ))}
      </div>

      {/* Footer */}
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          paddingTop: "32px",
          borderTop: "1px solid #262626",
          maxWidth: "900px",
          width: "100%",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <a
          href="https://github.com/shpaw415/frame-master"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#737373",
            textDecoration: "none",
            fontSize: "14px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
        >
          By Frame-Master
        </a>
      </footer>
    </div>
  );
}
