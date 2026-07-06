import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

function collectFrameBlock(lines, startIndex) {
  const block = [];
  let i = startIndex;
  const first = lines[i];

  if (/^\s*-\s+<Frame>/.test(first)) {
    block.push("<Frame>");
    i += 1;
  } else {
    block.push(first.replace(/^\s+/, ""));
    i += 1;
  }

  while (i < lines.length) {
    const line = lines[i];
    block.push(line.replace(/^\s+/, ""));
    if (line.trim() === "</Frame>") {
      i += 1;
      break;
    }
    i += 1;
  }

  return { block, nextIndex: i };
}

function fixContent(content) {
  const lines = content.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s+<Frame>/.test(line) || /^\s*-\s+<Frame>/.test(line)) {
      const { block, nextIndex } = collectFrameBlock(lines, i);
      if (result.length > 0 && result[result.length - 1].trim() !== "") {
        result.push("");
      }
      result.push(...block);
      if (nextIndex < lines.length && lines[nextIndex].trim() !== "") {
        result.push("");
      }
      i = nextIndex;
      continue;
    }

    let next = line;

    next = next.replace(/<\/Frame>\s*<Frame>/g, "</Frame>\n\n<Frame>");
    next = next.replace(/([^\n>\s])<Frame>/g, "$1\n\n<Frame>");

    result.push(next);
    i += 1;
  }

  return result.join("\n");
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "scripts" || entry === ".git") continue;
      walk(full, files);
    } else if (entry.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

let updated = 0;
for (const file of walk(ROOT)) {
  const original = readFileSync(file, "utf8");
  if (!original.includes("<Frame>")) continue;
  const fixed = fixContent(original);
  if (fixed !== original) {
    writeFileSync(file, fixed);
    updated += 1;
    console.log(file.replace(ROOT, ""));
  }
}

console.log(`Fixed ${updated} files.`);
