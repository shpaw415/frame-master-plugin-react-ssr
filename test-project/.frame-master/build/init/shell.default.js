import {
  __toESM,
  require_jsx_dev_runtime,
  require_react
} from "./../chunk-dbjth5j1.js";

// init/shell.default.tsx
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function Shell({ children }) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(import_react.StrictMode, {
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV("html", {
      id: "root",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV("head", {
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV("meta", {
              charSet: "UTF-8"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV("meta", {
              name: "viewport",
              content: "width=device-width, initial-scale=1.0"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV("title", {
              children: "Frame Master React SSR"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV("body", {
          children
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
export {
  Shell as default
};
