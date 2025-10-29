import type { OnLoadArgs } from "bun";
import type {
  ClientIPCManager,
  DirectiveTool,
} from "frame-master/plugin/utils";

type PartialOverRideResponse =
  | Partial<{
      /**
       * Parsed contents before Frame-Master processes it for internal features.
       */
      contents: string;
      /**
       * Loader type for Bun's build process.
       * Refer to Bun's documentation for available loader types.
       */
      loader: Bun.Loader;
    }>
  | undefined;

export type Build_Plugins = Partial<{
  /**
   * Add your own custom onLoad handlers for ts and tsx files in the **src/pages** or any subdirectory in process.cwd() directory.
   *
   * use the fileContent parameter to get the content of the file and modify it to be returned after.
   *
   * **You must modify the fileContent variable and return it as contents in the response object.**
   *
   * **Otherwise it will break Plugin chaining**
   *
   * @example
   *  tsx: (args, fileContent) => {
   *    // modify the fileContent as needed
   *    const modifiedContent = fileContent.replace("oldValue", "newValue");
   *    // OR
   *    const modifiedContent = new Bun.Transpiler({ loader: args.loader, }).transformSync(fileContent);
   *    return { contents: modifiedContent, loader: "js" };
   *  }
   */
  partialPluginOverRide: Partial<{
    /**
     * modify tsx files in the src/pages directory before Frame-Master processes it for internal features.
     *
     * **You must modify the fileContent variable and return it as contents in the response object.**
     *
     * **Otherwise it will break Plugin chaining**
     *
     * @example
     * tsx: (args, fileContent) => {
     *    // modify the fileContent as needed
     *    const modifiedContent = fileContent.replace("oldValue", "newValue");
     *    // OR
     *    const modifiedContent = new Bun.Transpiler({ loader: args.loader, }).transformSync(fileContent);
     *    return { contents: modifiedContent, loader: "js" };
     *  }
     * @param args
     * @param fileContent
     * @param fileDirectives file directives tool instance for testing file directives
     * @returns
     */
    tsx: (
      args: OnLoadArgs,
      fileContent: string,
      fileDirectives: DirectiveTool
    ) => Promise<PartialOverRideResponse> | PartialOverRideResponse;
    /**
     * modify ts files in the src/pages directory before Frame-Master processes it for internal features.
     *
     * **You must modify the fileContent variable and return it as contents in the response object.**
     *
     * **Otherwise it will break Plugin chaining**
     *
     * @example
     * tsx: (args, fileContent) => {
     *    // modify the fileContent as needed
     *    const modifiedContent = fileContent.replace("oldValue", "newValue");
     *    // OR
     *    const modifiedContent = new Bun.Transpiler({ loader: args.loader, }).transformSync(fileContent);
     *    return { contents: modifiedContent, loader: "js" };
     *  }
     * @param args
     * @param fileContent
     * @param fileDirectives file directives tool instance for testing file directives
     * @returns
     */
    ts: (
      args: OnLoadArgs,
      fileContent: string,
      fileDirectives: DirectiveTool
    ) => Promise<PartialOverRideResponse> | PartialOverRideResponse;
    /**
     * Other js like files (js, jsx, ts, tsx) somewhere else in project except src/pages directory
     *
     * **You must modify the fileContent variable and return it as contents in the response object.**
     *
     * **Otherwise it will break Plugin chaining**
     *
     * @example
     * others: (args, fileContent, fileDirectives) => {
     *    // modify the fileContent as needed
     *    const modifiedContent = fileContent.replace("oldValue", "newValue");
     *    return { contents: modifiedContent };
     * }
     */
    others: (
      args: OnLoadArgs,
      fileContent: string,
      fileDirectives: DirectiveTool
    ) => Promise<PartialOverRideResponse> | PartialOverRideResponse;
  }>;
}>;
