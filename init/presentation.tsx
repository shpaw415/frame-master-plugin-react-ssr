export default function Home() {
  return (
    <>
      <StyleGuide />
      <div className="container">
        {/* Logo/Icon */}
        <div className="logo">FMR</div>

        {/* Main Heading */}
        <h1 className="heading">
          Get started with
          <br />
          <span className="heading-accent">Frame-Master + React</span>
        </h1>

        {/* Subtitle */}
        <p className="subtitle">
          Edit <code className="code">src/pages/index.tsx</code> and save to
          reload.
        </p>

        {/* Links Grid */}
        <div className="links-grid">
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
              className="link-card"
            >
              <div className="link-icon">{link.icon}</div>
              <h2 className="link-title">
                {link.title}
                <span className="link-arrow">→</span>
              </h2>
              <p className="link-desc">{link.desc}</p>
            </a>
          ))}
        </div>

        {/* Footer */}
        <footer className="footer">
          <a
            href="https://github.com/shpaw415/frame-master"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            By Frame-Master
          </a>
        </footer>
      </div>
    </>
  );
}

function StyleGuide() {
  return (
    <style>{`
      body {
        margin: 0;
      }

      .container {
        min-height: 100vh;
        background: #0a0a0a;
        color: #ededed;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .logo {
        width: 120px;
        height: 120px;
        border-radius: 24px;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        font-size: 48px;
        font-weight: 700;
        color: white;
      }

      .heading {
        font-size: 56px;
        font-weight: 700;
        margin: 0 0 16px 0;
        text-align: center;
        letter-spacing: -0.02em;
      }

      .heading-accent {
        color: #3b82f6;
      }

      .subtitle {
        font-size: 18px;
        color: #a3a3a3;
        margin: 0 0 48px 0;
        text-align: center;
        max-width: 500px;
        line-height: 1.6;
      }

      .code {
        background: #1a1a1a;
        padding: 4px 8px;
        border-radius: 6px;
        color: #3b82f6;
        font-size: 16px;
      }

      .links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        max-width: 900px;
        width: 100%;
        margin-bottom: 64px;
      }

      .link-card {
        padding: 24px;
        background: #1a1a1a;
        border: 1px solid #262626;
        border-radius: 12px;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s;
        cursor: pointer;
      }

      .link-card:hover {
        border-color: #3b82f6;
        background: #1e1e1e;
      }

      .link-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .link-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .link-arrow {
        font-size: 14px;
        color: #737373;
      }

      .link-desc {
        font-size: 14px;
        color: #737373;
        margin: 0;
        line-height: 1.5;
      }

      .footer {
        display: flex;
        align-items: center;
        gap: 24px;
        padding-top: 32px;
        border-top: 1px solid #262626;
        max-width: 900px;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }

      .footer-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #737373;
        text-decoration: none;
        font-size: 14px;
        transition: color 0.2s;
      }

      .footer-link:hover {
        color: #3b82f6;
      }
    `}</style>
  );
}
