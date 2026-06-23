import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const allowedGlobals = new Set([
  "React",
  "Fragment",
  "Suspense",
  "StrictMode",
]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(jsx|tsx)$/.test(entry.name) ? [full] : [];
  });

const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const addImportBindings = (source, bindings) => {
  const withoutSideEffectImports = source.replace(/^\s*import\s+["'][^"']+["'];?\s*$/gm, "");
  const importRegex = /import\s+([\s\S]*?)\s+from\s+["'][^"']+["'];?/g;
  let match;

  while ((match = importRegex.exec(withoutSideEffectImports))) {
    const clause = match[1].trim();
    if (!clause) continue;

    if (clause.startsWith("{")) {
      for (const part of clause.replace(/[{}]/g, "").split(",")) {
        const clean = part.trim();
        if (!clean) continue;
        const alias = clean.split(/\s+as\s+/).pop().trim();
        bindings.add(alias);
      }
      continue;
    }

    const commaIndex = clause.indexOf(",");
    const defaultOrNamespace = commaIndex >= 0 ? clause.slice(0, commaIndex).trim() : clause;
    const named = commaIndex >= 0 ? clause.slice(commaIndex + 1).trim() : "";

    if (defaultOrNamespace.includes("* as")) {
      bindings.add(defaultOrNamespace.split(/\*\s+as\s+/).pop().trim());
    } else if (defaultOrNamespace) {
      bindings.add(defaultOrNamespace);
    }

    if (named.includes("{")) {
      for (const part of named.replace(/[{}]/g, "").split(",")) {
        const clean = part.trim();
        if (!clean) continue;
        bindings.add(clean.split(/\s+as\s+/).pop().trim());
      }
    }
  }
};

const addLocalBindings = (source, bindings) => {
  const patterns = [
    /\b(?:function|class)\s+([A-Z][A-Za-z0-9_]*)/g,
    /\b(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\b/g,
    /\b([A-Z][A-Za-z0-9_]*)\s*=/g,
    /:\s*([A-Z][A-Za-z0-9_]*)\b/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) bindings.add(match[1]);
  }

  const arrayParamRegex = /\(\s*\[([^\]]+)\]\s*\)\s*=>/g;
  let arrayMatch;
  while ((arrayMatch = arrayParamRegex.exec(source))) {
    for (const part of arrayMatch[1].split(",")) {
      const name = part.trim();
      if (/^[A-Z][A-Za-z0-9_]*$/.test(name)) bindings.add(name);
    }
  }
};

const findJsxTags = (source) => {
  const tags = new Set();
  const tagRegex = /<\s*([A-Z][A-Za-z0-9_.$]*)\b/g;
  let match;
  while ((match = tagRegex.exec(source))) {
    const rootName = match[1].split(".")[0];
    tags.add(rootName);
  }
  return tags;
};

const failures = [];

for (const file of walk(root)) {
  const source = stripComments(fs.readFileSync(file, "utf8"));
  const bindings = new Set(allowedGlobals);
  addImportBindings(source, bindings);
  addLocalBindings(source, bindings);

  const missing = [...findJsxTags(source)].filter((tag) => !bindings.has(tag));
  if (missing.length) {
    failures.push({ file: path.relative(process.cwd(), file), missing });
  }
}

if (failures.length) {
  console.error("JSX identifiers used without import or local declaration:\n");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.missing.join(", ")}`);
  }
  process.exit(1);
}

console.log("JSX import check passed.");
