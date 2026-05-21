#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repositoryRoot = path.resolve(scriptDir, "..");

const outputRelativePath = process.argv[2] ?? "scripts/output/baseline-metrics.json";
const outputPath = path.resolve(repositoryRoot, outputRelativePath);

const LOC_THRESHOLD = 400;
const sourceCodeExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const ignoredRootDirectories = new Set([
  ".git",
  "node_modules",
  "build",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
  "docs-site/node_modules",
  "docs-site/build",
]);

const generatedPathRules = [
  /^src\/shared\/api\/graphql\//,
  /^src\/ui-components\//,
  /^src\/aws-exports\.js$/,
];

const toPosixPath = (filePath) => filePath.split(path.sep).join("/");

const countLines = (content) => {
  if (content.length === 0) {
    return 0;
  }
  return content.split(/\r?\n/).length;
};

const isSourceCodeFile = (relativePath) => {
  const extension = path.extname(relativePath);
  return sourceCodeExtensions.has(extension);
};

const isTestCodeFile = (relativePath) =>
  relativePath.includes("/__tests__/") ||
  /(?:^|\/)__tests__\//.test(relativePath) ||
  /\.(test|spec)\.[jt]sx?$/.test(relativePath) ||
  relativePath.startsWith("playwright/tests/");

const isGeneratedFile = (relativePath) =>
  generatedPathRules.some((rule) => rule.test(relativePath));

const shouldSkipDirectory = (relativePath) => {
  if (!relativePath) {
    return false;
  }
  return [...ignoredRootDirectories].some(
    (ignored) => relativePath === ignored || relativePath.startsWith(`${ignored}/`)
  );
};

const collectFiles = (currentAbsolutePath = repositoryRoot, collected = []) => {
  const relative = toPosixPath(path.relative(repositoryRoot, currentAbsolutePath));
  if (relative && shouldSkipDirectory(relative)) {
    return collected;
  }

  const entries = fs.readdirSync(currentAbsolutePath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(currentAbsolutePath, entry.name);
    const relativePath = toPosixPath(path.relative(repositoryRoot, absolutePath));

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(relativePath)) {
        continue;
      }
      collectFiles(absolutePath, collected);
      continue;
    }

    collected.push(relativePath);
  }

  return collected;
};

const allFiles = collectFiles();

let implementationCodeLineCount = 0;
let testCodeLineCount = 0;
const oversizedFiles = [];
const directMuiImportOccurrences = [];
const muiImportCountByFile = new Map();
let scssImportCount = 0;
const scssImportCountByFile = new Map();
const scssFiles = [];

for (const relativePath of allFiles) {
  if (relativePath.endsWith(".scss")) {
    scssFiles.push(relativePath);
  }

  if (!isSourceCodeFile(relativePath)) {
    continue;
  }

  if (isGeneratedFile(relativePath)) {
    continue;
  }

  const absolutePath = path.join(repositoryRoot, relativePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = countLines(content);

  if (relativePath.startsWith("src/") && !isTestCodeFile(relativePath)) {
    implementationCodeLineCount += lines;
    if (lines >= LOC_THRESHOLD) {
      oversizedFiles.push({ path: relativePath, lines });
    }
  }

  if (isTestCodeFile(relativePath)) {
    testCodeLineCount += lines;
  }

  const fileLines = content.split(/\r?\n/);
  fileLines.forEach((lineContent, index) => {
    if (/^\s*import(?:.+from\s+)?['"]@mui\/[^'"]+['"]\s*;?\s*$/.test(lineContent)) {
      directMuiImportOccurrences.push({
        path: relativePath,
        line: index + 1,
        text: lineContent.trim(),
      });
      muiImportCountByFile.set(
        relativePath,
        (muiImportCountByFile.get(relativePath) ?? 0) + 1
      );
    }

    if (/^\s*import(?:.+from\s+)?['"][^'"]+\.scss['"]\s*;?\s*$/.test(lineContent)) {
      scssImportCount += 1;
      scssImportCountByFile.set(
        relativePath,
        (scssImportCountByFile.get(relativePath) ?? 0) + 1
      );
    }
  });
}

oversizedFiles.sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));

const muiImportFiles = [...muiImportCountByFile.entries()]
  .map(([filePath, count]) => ({ path: filePath, count }))
  .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));

const scssImportFiles = [...scssImportCountByFile.entries()]
  .map(([filePath, count]) => ({ path: filePath, count }))
  .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));

const output = {
  generatedAt: new Date().toISOString(),
  metricsVersion: 1,
  threshold: {
    oversizedFileLoc: LOC_THRESHOLD,
  },
  summary: {
    nonGeneratedImplementationCodeLineCount: implementationCodeLineCount,
    testCodeLineCount,
    oversizedFileCount: oversizedFiles.length,
    directMuiImportCount: directMuiImportOccurrences.length,
    scssUsageCount: scssFiles.length + scssImportCount,
    scssFileCount: scssFiles.length,
    scssImportCount,
  },
  details: {
    oversizedFiles,
    directMuiImports: {
      occurrences: directMuiImportOccurrences.length,
      files: muiImportFiles,
    },
    scssUsage: {
      scssFiles,
      importFiles: scssImportFiles,
    },
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

console.log(`Baseline metrics generated: ${toPosixPath(path.relative(repositoryRoot, outputPath))}`);
