/**
 * Custom Jest transformer that wraps ts-jest and replaces
 * import.meta.env.* expressions so they can be parsed in CommonJS context.
 */
const { TsJestTransformer } = require("ts-jest");

const transformer = new TsJestTransformer({
  tsconfig: { module: "CommonJS", moduleResolution: "node" },
});

module.exports = {
  process(sourceText, sourcePath, options) {
    const result = transformer.process(sourceText, sourcePath, options);
    const code =
      typeof result === "string" ? result : result.code ?? result;

    const patched = code
      .replace(/import\.meta\.env\.DEV/g, "false")
      .replace(/import\.meta\.env\.PROD/g, "true")
      .replace(/import\.meta\.env\.(\w+)/g, "(process.env.$1 ?? undefined)");

    return typeof result === "string"
      ? patched
      : { ...result, code: patched };
  },
};
