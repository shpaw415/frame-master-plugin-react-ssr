export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)",
        color: "#e0e6ed",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "50px",
            marginBottom: "30px",
            fontSize: "14px",
            color: "#60a5fa",
          }}
        >
          ⚡ Powered by React 19, Bun & Frame-Master
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: "800",
            margin: "0 0 20px 0",
            background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Frame-Master
          <br />
          React SSR Plugin
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            maxWidth: "700px",
            margin: "0 auto 40px",
            lineHeight: "1.6",
          }}
        >
          A powerful React Server-Side Rendering plugin with file-based routing,
          streaming SSR, and seamless client-side navigation.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: "600",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
            }}
          >
            Get Started →
          </button>
          <button
            style={{
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: "600",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#e0e6ed",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            View Docs
          </button>
        </div>
      </section>

      {/* Code Example */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            <span
              style={{ marginLeft: "16px", fontSize: "14px", color: "#64748b" }}
            >
              frame-master.config.ts
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#abb2bf",
              overflowX: "auto",
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            }}
          >
            <code>
              <span style={{ color: "#c678dd" }}>import</span>{" "}
              <span style={{ color: "#abb2bf" }}>{"{"}</span>{" "}
              <span style={{ color: "#e06c75" }}>FrameMasterConfig</span>{" "}
              <span style={{ color: "#abb2bf" }}>{"}"}</span>{" "}
              <span style={{ color: "#c678dd" }}>from</span>{" "}
              <span style={{ color: "#98c379" }}>
                "frame-master/server/types"
              </span>
              <span style={{ color: "#abb2bf" }}>;</span>
              {"\n"}
              <span style={{ color: "#c678dd" }}>import</span>{" "}
              <span style={{ color: "#e06c75" }}>ReactSSRPlugin</span>{" "}
              <span style={{ color: "#c678dd" }}>from</span>{" "}
              <span style={{ color: "#98c379" }}>
                "frame-master-plugin-react-ssr"
              </span>
              <span style={{ color: "#abb2bf" }}>;</span>
              {"\n\n"}
              <span style={{ color: "#c678dd" }}>export default</span>{" "}
              <span style={{ color: "#abb2bf" }}>{"{"}</span>
              {"\n"}
              {"  "}
              <span style={{ color: "#e06c75" }}>HTTPServer</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#abb2bf" }}>{"{"}</span>{" "}
              <span style={{ color: "#e06c75" }}>port</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#d19a66" }}>3000</span>{" "}
              <span style={{ color: "#abb2bf" }}>{"}"}</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"  "}
              <span style={{ color: "#e06c75" }}>plugins</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#abb2bf" }}>[</span>
              {"\n"}
              {"    "}
              <span style={{ color: "#61afef" }}>ReactSSRPlugin</span>
              <span style={{ color: "#abb2bf" }}>({"{"}</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>pathToPagesDir</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#98c379" }}>"src/pages"</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>pathToBuildDir</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#98c379" }}>".frame-master/build"</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>pathToShellFile</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#98c379" }}>
                ".frame-master/shell.tsx"
              </span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>pathToClientWrapper</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#98c379" }}>
                ".frame-master/client-wrapper.tsx"
              </span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>debug</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#d19a66" }}>false</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"      "}
              <span style={{ color: "#e06c75" }}>enableLayout</span>
              <span style={{ color: "#abb2bf" }}>:</span>{" "}
              <span style={{ color: "#d19a66" }}>true</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"    "}
              <span style={{ color: "#abb2bf" }}>{"}"}</span>
              <span style={{ color: "#abb2bf" }}>)</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              {"  "}
              <span style={{ color: "#abb2bf" }}>]</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              {"\n"}
              <span style={{ color: "#abb2bf" }}>{"}"}</span>{" "}
              <span style={{ color: "#c678dd" }}>satisfies</span>{" "}
              <span style={{ color: "#e5c07b" }}>FrameMasterConfig</span>
              <span style={{ color: "#abb2bf" }}>;</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features Grid */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >
        <h2
          style={{
            fontSize: "42px",
            fontWeight: "700",
            textAlign: "center",
            marginBottom: "60px",
            color: "#ffffff",
          }}
        >
          Powerful Features
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: "📁",
              title: "File-based Routing",
              desc: "Zero-config routing based on your file structure",
            },
            {
              icon: "🔄",
              title: "Streaming SSR",
              desc: "Progressive rendering with React 19 capabilities",
            },
            {
              icon: "🔥",
              title: "Hot Module Replacement",
              desc: "Instant feedback during development via WebSocket",
            },
            {
              icon: "🎨",
              title: "Nested Layouts",
              desc: "Shared UI components with automatic stacking",
            },
            {
              icon: "🪝",
              title: "Powerful Hooks",
              desc: "useRoute(), useRouteEffect(), useServerSideProps()",
            },
            {
              icon: "⚡",
              title: "Client Navigation",
              desc: "Fast SPA-like navigation with automatic hydration",
            },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                padding: "32px",
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#ffffff",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "#94a3b8",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 20px 80px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "42px",
            fontWeight: "700",
            marginBottom: "40px",
            color: "#ffffff",
          }}
        >
          Quick Start
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            textAlign: "left",
          }}
        >
          {[
            {
              step: "1",
              cmd: "bun add frame-master-plugin-react-ssr",
              desc: "Install the plugin",
            },
            {
              step: "2",
              cmd: "bunx fmp-react-ssr init",
              desc: "Initialize configuration files",
            },
            { step: "3", cmd: "bun dev", desc: "Start development server" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "24px",
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div style={{ flex: 1 }}>
                <code
                  style={{
                    padding: "8px 16px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#60a5fa",
                    display: "inline-block",
                    marginBottom: "8px",
                  }}
                >
                  {item.cmd}
                </code>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#94a3b8",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          MIT © 2025 Frame-Master · Built with ❤️ and Bun
        </p>
      </footer>
    </div>
  );
}
