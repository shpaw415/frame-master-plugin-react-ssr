# frame-master-plugin-react-ssr

A powerful React Server-Side Rendering (SSR) plugin for Frame-Master, providing file-based routing, streaming SSR with React 19, and seamless client-side navigation.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/shpaw415/frame-master-plugin-react-ssr)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## ✨ Features

### Core Features

- 📁 **File-based Routing** - Zero-config routing based on your file structure
- 🔄 **Streaming SSR** - Progressive rendering with React 19 streaming capabilities
- 🎯 **React Directives** - Full support for `"use client"`, `"use server"`, and `"server-only"`
- 🌊 **Response Streaming** - Chunked responses for improved perceived performance
- 🔥 **Hot Module Replacement** - Instant feedback during development via WebSocket
- 🎨 **Nested Layouts** - Shared UI components with automatic layout stacking

### Developer Experience

- 🪝 **Powerful Hooks** - `useRoute()`, `useRouteEffect()`, `useServerSideProps()`, `useRequest()`
- ⚡ **Client-Side Navigation** - Fast SPA-like navigation with automatic hydration
- 🔌 **Server-Side Props** - Fetch data on the server before rendering
- 🛠️ **Customizable** - Override Shell and ClientWrapper for full control
- 🐛 **Debug Mode** - Built-in logging for development troubleshooting

### Architecture

- **Shell** - Server-side HTML template for on-the-fly modifications
- **ClientWrapper** - Client-side state management and router customization
- **RouterHost** - Handles navigation, HMR, and lifecycle management

---

## 📦 Installation

```bash
bun add frame-master-plugin-react-ssr
```

### Quick Setup

Initialize the plugin to generate default files:

```bash
bunx fmp-react-ssr init
```

This creates:

- `.frame-master/shell.tsx` - Server-side HTML shell
- `.frame-master/client-wrapper.tsx` - Client-side wrapper component
- `src/pages` - Default page route ( can be customized in the config )

---

## 🚀 Getting Started

### 1. Configure Frame-Master

Add the plugin to your `frame-master.config.ts`:

```typescript
import { FrameMasterConfig } from "frame-master/server/types";
import ReactSSRPlugin from "frame-master-plugin-react-ssr";

export default {
  HTTPServer: {
    port: 3000,
  },
  plugins: [
    ReactSSRPlugin({
      pathToPagesDir: "src/pages",
      pathToBuildDir: ".frame-master/build",
      pathToShellFile: ".frame-master/shell.tsx",
      pathToClientWrapper: ".frame-master/client-wrapper.tsx",
      debug: false,
      enableLayout: true,
    }),
  ],
} satisfies FrameMasterConfig;
```

### 2. Create Your First Page

Create `src/pages/index.tsx`:

```tsx
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Frame-Master!</h1>
      <p>Your React SSR app is ready.</p>
    </div>
  );
}
```

### 3. Run Development Server

```bash
bun dev
```

Visit `http://localhost:3000` to see your app!

---

## 📂 File Structure

```
your-project/
├── src/
│   └── pages/
│       ├── index.tsx           # Route: /
│       ├── about.tsx           # Route: /about
│       ├── layout.tsx          # Root layout (wraps all pages)
│       └── blog/
│           ├── layout.tsx      # Blog layout (wraps blog pages)
│           └── index.tsx       # Route: /blog
├── .frame-master/
│   ├── shell.tsx               # Server-side HTML template
│   ├── client-wrapper.tsx      # Client-side wrapper
│   └── build/                  # Build output
└── frame-master.config.ts      # Frame-Master configuration
```

---

## 🎯 Usage Examples

### Navigation

```tsx
import { useRoute } from "frame-master-plugin-react-ssr/hooks";

export default function Navigation() {
  const route = useRoute();

  return (
    <nav>
      <button onClick={() => route.navigate("/")}>Home</button>
      <button onClick={() => route.navigate("/about")}>About</button>
      <p>Current path: {route.pathname}</p>
    </nav>
  );
}
```

### Server-Side Props

Create `src/pages/users/index.tsx`:

```tsx
import { useServerSideProps } from "frame-master-plugin-react-ssr/hooks";

export default function UsersPage() {
  const props = useServerSideProps<{ users: Array<{ name: string }> }>();

  if (!props) return <div>Loading...</div>;

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {props.users.map((user, i) => (
          <li key={i}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

Create `src/pages/users/getServerSideProps.ts`:

```tsx
import type { masterRequest } from "frame-master/server/request";

export default async function getServerSideProps(req: masterRequest) {
  const users = await fetch("https://api.example.com/users").then((r) =>
    r.json()
  );
  return { users };
}
```

### Layouts

Create `src/pages/layout.tsx`:

```tsx
import type { JSX } from "react";

export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <div>
      <header>
        <h1>My App</h1>
        <nav>{/* navigation */}</nav>
      </header>
      <main>{children}</main>
      <footer>© 2025 My App</footer>
    </div>
  );
}
```

### Route Effects

```tsx
import { useRouteEffect } from "frame-master-plugin-react-ssr/hooks";

export default function Analytics() {
  useRouteEffect(() => {
    // Runs on every route change (not on initial load)
    console.log("Route changed!");
    trackPageView(window.location.pathname);
  });

  return <div>Analytics tracking active</div>;
}
```

---

## ⚙️ Configuration Options

| Option                | Type              | Default                 | Description                     |
| --------------------- | ----------------- | ----------------------- | ------------------------------- |
| `pathToPagesDir`      | `string`          | `"src/pages"`           | Directory containing your pages |
| `pathToBuildDir`      | `string`          | `".frame-master/build"` | Build output directory          |
| `pathToShellFile`     | `string`          | Plugin default          | Custom HTML shell template      |
| `pathToClientWrapper` | `string`          | Plugin default          | Custom client wrapper component |
| `debug`               | `boolean`         | `false`                 | Enable debug logging            |
| `enableLayout`        | `boolean`         | `true`                  | Enable nested layout feature    |
| `buildConfig`         | `Build_Plugins[]` | `[]`                    | Additional build plugins        |
| `priority`            | `number`          | `10`                    | Plugin execution priority       |

---

## 🪝 Hooks API

### `useRoute()`

Access current route information and navigation methods.

```tsx
const route = useRoute();

// Properties
route.pathname; // Current path: "/blog/post-1"
route.searchParams; // URLSearchParams object
route.isInitial; // true on first render
route.version; // Increments on each navigation

// Methods
route.navigate("/about"); // Navigate to /about
route.navigate("/search", { q: "react" }); // Navigate with query params
route.reload(); // Reload current route
```

### `useRouteEffect(callback)`

Run effects on route changes (skips initial render).

```tsx
useRouteEffect(() => {
  console.log("Route changed!");
  // Cleanup function (optional)
  return () => console.log("Cleanup");
});
```

### `useServerSideProps<T>()`

Access server-side props for the current route.

```tsx
const props = useServerSideProps<{ data: string }>();

if (!props) return <div>Loading...</div>;
return <div>{props.data}</div>;
```

### `useRequest()`

Access the Frame-Master request object (server-side only).

```tsx
const request = useRequest();
// Returns null on client-side
```

---

## 🎨 Customization

### Custom Shell

Modify `.frame-master/shell.tsx` to customize the HTML structure:

```tsx
import { StrictMode, type JSX } from "react";

export default function Shell({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Custom App</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div id="app">{children}</div>
        <script src="/analytics.js" />
      </body>
    </html>
  );
}
```

### Custom ClientWrapper

Modify `.frame-master/client-wrapper.tsx` for custom client-side logic:

```tsx
import { StrictMode, type JSX } from "react";
import { RouterHost } from "frame-master-plugin-react-ssr/router";

export default function ClientWrapper({ children }: { children: JSX.Element }) {
  return (
    <StrictMode>
      {/* Add global providers here */}
      <ThemeProvider>
        <AuthProvider>
          <RouterHost>{children}</RouterHost>
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
```

---

## 🔧 Advanced Usage

### Disable Layouts

```typescript
ReactSSRPlugin({
  enableLayout: false,
  // ... other options
});
```

### Debug Mode

```typescript
ReactSSRPlugin({
  debug: true, // Enables verbose logging
  // ... other options
});
```

### Custom Build Plugins

```typescript
import type { Build_Plugins } from "frame-master-plugin-react-ssr/build/types";

ReactSSRPlugin({
  buildConfig: [
    // Your custom build plugins
  ] as Build_Plugins[],
});
```

---

## 🚦 Roadmap

- [ ] Route caching for improved performance
- [ ] Dynamic route handling (client/server)
- [ ] Incremental Static Regeneration (ISR)
- [ ] API routes support
- [ ] Middleware system
- [ ] Image optimization

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT © [Frame-Master](https://github.com/shpaw415/frame-master)

---

## 🆘 Support

- 📖 [Documentation](https://github.com/shpaw415/frame-master)
- 🐛 [Report Issues](https://github.com/shpaw415/frame-master-plugin-react-ssr/issues)
- 💬 [Discussions](https://github.com/shpaw415/frame-master/discussions)
