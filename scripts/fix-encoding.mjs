import fs from "node:fs";
import path from "node:path";

const roots = ["frontend/src", "backend/src"];
const extensions = new Set([".js", ".jsx", ".css", ".sql"]);

const replacements = [
  ["ÃƒÂ ", "à"],
  ["ÃƒÂ©", "é"],
  ["ÃƒÂ¨", "è"],
  ["ÃƒÂª", "ê"],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ãª", "ê"],
  ["Ã«", "ë"],
  ["Ã ", "à"],
  ["Ã¢", "â"],
  ["Ã¹", "ù"],
  ["Ã»", "û"],
  ["Ã´", "ô"],
  ["Ã®", "î"],
  ["Ã¯", "ï"],
  ["Ã§", "ç"],
  ["Ã‰", "É"],
  ["Ã€", "À"],
  ["ÃŠ", "Ê"],
  ["Ã‡", "Ç"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€�", "”"],
  ["â€", "”"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€¦", "…"],
  ["Â·", "·"],
  ["Â«", "«"],
  ["Â»", "»"],
  ["Â ", " "],
  ["cÅ“ur", "cœur"],
  ["Å“", "œ"],
];

const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filename);
      continue;
    }

    if (!extensions.has(path.extname(filename))) continue;

    const current = fs.readFileSync(filename, "utf8");
    let next = current;
    for (const [broken, fixed] of replacements) {
      next = next.split(broken).join(fixed);
    }

    if (next !== current) fs.writeFileSync(filename, next, "utf8");
  }
};

for (const root of roots) walk(root);
