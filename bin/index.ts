#!/usr/bin/env bun
import { program } from "commander";

program
  .name("frame-master-react-ssr")
  .description("CLI for Frame-Master React SSR plugin")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize React SSR plugin in your Frame-Master project")
  .action(async () => {
    console.log("🚀 Initializing Frame-Master React SSR plugin...");

    try {
      const { default: initPlugin } = await import("./init");
      await initPlugin();
    } catch (error) {
      console.error("❌ Failed to initialize React SSR plugin:");
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
