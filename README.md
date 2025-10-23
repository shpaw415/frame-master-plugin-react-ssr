# frame-master-plugin-react-ssr

A powerful React Server-Side Rendering (SSR) plugin for Frame-Master, providing file-based routing, streaming SSR, and seamless client-side navigation.

## 🚀 Features

- **📁 File-based Routing** - Automatic routing based on your file structure
- **🔄 Server-Side Rendering** - Streaming SSR with React 19
- **⚡ Client-Side Navigation** - Fast SPA-like navigation with hydration
- **🎨 Layouts** - Nested layout support for shared UI
- **🔌 Server-Side Props** - Fetch data on the server via `getServerSideProps`
- **🎯 Directives** - Control rendering strategy with `"use client"`, `"use server"`, `"server-only"`
- **🔥 Hot Module Replacement** - Instant updates during development
- **🌊 Response Streaming** - Progressive rendering for better performance
- **🪝 Navigation Hooks** - React hooks for routing and navigation

## 📦 Installation

```bash
bun add frame-master-plugin-react-ssr
```

## 🎯 Quick Start

### 1. Initialize the Plugin

```bash
bunx frame-master-plugin-react-ssr init
```

This creates:

- `shell.tsx` - Root shell component

### 2. Configure Frame-Master

```typescript
// frame-master.config.ts
import type { FrameMasterConfig } from "frame-master/server/type";
import ReactSSRPlugin from "frame-master-plugin-react-ssr/plugin";

const config: FrameMasterConfig = {
  HTTPServer: { port: 3000 },
  plugins: [
    ReactSSRPlugin({
      pathToPagesDir: "src/pages",
      pathToBuildDir: ".frame-master/build",
      debug: false,
    }),
  ],
};

export default config;
```

### 3. Create Your First Page

```tsx
// src/pages/index.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Frame-Master React SSR!</h1>
      <p>This is server-side rendered ✨</p>
    </div>
  );
}
```

### 4. Start the Server

```bash
bun frame-master dev
```

Visit `http://localhost:3000` to see your SSR React app!

## 📂 File-Based Routing

The plugin automatically creates routes based on your file structure:

```
src/pages/
├── index.tsx              → /
├── about/
│   ├── index.tsx          → /about
│   ├── layout.tsx         → Layout for /about/*
│   └── team/
│       └── index.tsx      → /about/team
└── blog/
    ├── index.tsx          → /blog
    └── [id]/
        └── index.tsx      → /blog/:id (dynamic route)
```

### Dynamic Routes (Coming Soon)

```tsx
// src/pages/blog/[id]/index.tsx
export default function BlogPost() {
  // Access route params
  return <article>Blog Post</article>;
}
```

## 🎨 Layouts

Layouts wrap pages and persist across navigation:

```tsx
// src/pages/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <div className="dashboard">
      <nav>Dashboard Navigation</nav>
      <main>{children}</main>
    </div>
  );
}
```

```tsx
// src/pages/dashboard/index.tsx
export default function DashboardPage() {
  return <h1>Dashboard Home</h1>;
}
// Automatically wrapped with DashboardLayout
```

## 🔌 Server-Side Props

Fetch data on the server before rendering:

```tsx
// src/pages/users/index.tsx
import type { masterRequest } from "frame-master/server/request";
import { useServerSideProps } from "frame-master-plugin-react-ssr/hooks";

export async function getServerSideProps(request: masterRequest) {
  const users = await fetch("https://api.example.com/users").then((r) =>
    r.json()
  );

  return {
    users,
    timestamp: Date.now(),
  };
}

export default function UsersPage() {
  const props = useServerSideProps<{ users: any[]; timestamp: number }>();

  if (!props) return <div>Loading...</div>;

  return (
    <div>
      <h1>Users ({props.timestamp})</h1>
      <ul>
        {props.users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Redirects from getServerSideProps ( coming soon )

```tsx
export async function getServerSideProps(request: masterRequest) {
  const user = await checkAuth(request);

  if (!user) {
    return { redirect: "/login" };
  }

  return { user };
}
```

## 🪝 Hooks

### `useRoute()`

Access current route information:

```tsx
import { useRoute } from "frame-master-plugin-react-ssr/hooks";

function Navigation() {
  const route = useRoute();

  return (
    <nav>
      <p>Current: {route.pathname}</p>
      <button onClick={() => route.navigate("/about")}>Go to About</button>
      <button onClick={() => route.reload()}>Reload Page</button>
    </nav>
  );
}
```

**Properties:**

- `pathname: string` - Current path
- `searchParams: URLSearchParams` - Query parameters
- `navigate(to: string, searchParams?)` - Navigate to a new route
- `reload()` - Reload current route
- `isInitial: boolean` - True on first page load
- `version: number` - Increments on each navigation

### `useRouteEffect()`

Run effects when route changes (not on initial load):

```tsx
import { useRouteEffect } from "frame-master-plugin-react-ssr/hooks";

function Analytics() {
  useRouteEffect(() => {
    console.log("Route changed!");
    trackPageView(window.location.pathname);

    return () => {
      // Cleanup
    };
  });

  return null;
}
```

### `useServerSideProps<T>()`

Access server-side props in components:

```tsx
import { useServerSideProps } from "frame-master-plugin-react-ssr/hooks";

function UserProfile() {
  const props = useServerSideProps<{ user: User }>();

  if (!props) return <div>Loading...</div>;

  return <div>Welcome, {props.user.name}!</div>;
}
```

### `useRequest()`

Access the Frame-Master request object (server-side only):

```tsx
import { useRequest } from "frame-master-plugin-react-ssr/hooks";

function ServerInfo() {
  const request = useRequest();

  // Only available during SSR
  if (!request) return null;

  return <div>User-Agent: {request.request.headers.get("user-agent")}</div>;
}
```

## 🎯 Directives

Control where and how your code runs:

### `"use client"`

Mark components for client-side only:

```tsx
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>;
}
```

### `"use server"`

Mark components for server-side rendering (default):

```tsx
"use server";

export default async function ServerComponent() {
  const data = await fetchServerData();
  return <div>{data}</div>;
}
```

### `"server-only"`

Prevent code from being bundled for the client:

```tsx
"server-only";

import { db } from "./database"; // Won't be bundled

export async function getUsers() {
  return await db.users.findMany();
}
```

## 🎨 Custom Shell

The shell wraps your entire application:

```tsx
// shell.tsx
import type { masterRequest } from "frame-master/server/request";
import Shell from "frame-master-plugin-react-ssr/shell";

export default function MyShell({
  children,
  request,
}: {
  children: JSX.Element;
  request: masterRequest | null;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Shell request={request}>{children}</Shell>
      </body>
    </html>
  );
}
```

## ⚙️ Configuration Options

```typescript
type ReactSSRPluginOptions = {
  /** Path to pages directory (default: "src/pages") */
  pathToPagesDir?: string;

  /** Path to build output (default: ".frame-master/build") */
  pathToBuildDir?: string;

  /** Path to shell component (default: uses built-in) */
  pathToShellFile?: string;

  /** Enable debug logs (default: false) */
  debug?: boolean;

  /** Custom build plugins */
  buildConfig?: Build_Plugins[];

  /** Plugin priority (default: 10) */
  priority?: number;
};
```

## 🔧 Advanced Usage

### Custom Build Configuration

```typescript
import ReactSSRPlugin from "frame-master-plugin-react-ssr/plugin";

ReactSSRPlugin({
  buildConfig: [
    {
      buildOptions: {
        external: ["some-package"],
        define: {
          "process.env.API_URL": JSON.stringify(process.env.API_URL),
        },
      },
    },
  ],
});
```

### Programmatic Navigation

```tsx
function LoginButton() {
  const route = useRoute();

  const handleLogin = async () => {
    await loginUser();
    route.navigate("/dashboard", { from: "login" });
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## 🐛 Debugging

Enable debug mode to see detailed logs:

```typescript
ReactSSRPlugin({
  debug: true,
});
```

## 📝 Best Practices

1. **Use Layouts** - Share common UI across pages
2. **Server-Side Props** - Fetch data on the server for better SEO
3. **Use Directives** - Mark client-only code with `"use client"`
4. **Streaming** - Let React stream responses for faster TTFB
5. **Error Boundaries** - Wrap components with error boundaries

## 🤝 Contributing

Contributions are welcome! Please check the [Frame-Master](https://github.com/shpaw415/frame-master) repository.

## 📄 License

MIT

## 🔗 Links

- [Frame-Master](https://github.com/shpaw415/frame-master)
- [React 19 Docs](https://react.dev)
- [Bun](https://bun.sh)
