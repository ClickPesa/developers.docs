import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

const ALT_OVERRIDES = {
  "onboarding-sign-up.png": "ClickPesa account registration form",
  "onboarding-email-registration.png": "Email verification message in inbox",
  "onboarding-email-verified.png": "Email verified confirmation screen",
  "SCR-20240917-csdw.png": "Merchant Dashboard login page",
  "SCR-20240917-csdw-1.png": "Login page with Forgot password link",
  "SCR-20240917-ctkc.png": "OTP phone number entry screen",
  "SCR-20240917-ctgi.png": "OTP code verification screen",
  "SCR-20240917-cqcr.png": "Business name entry during first login",
  "SCR-20240401-oepq.png": "Merchant Dashboard homepage after registration",
  "SCR-20240917-dgvd.png": "Settings sidebar with General selected",
  "SCR-20240401-tegk.png": "General settings edit form",
  "SCR-20240401-teju.png": "General settings saved confirmation",
  "password-reset-enter-email.png": "Password reset email entry form",
  "password-reset-email.png": "Password reset email with Reset Password button",
  "password-reset-update-password.png": "New password entry form",
  "password-reset-password-updated.png": "Password updated confirmation screen",
};

function altFromPath(path) {
  const filename = path.split("/").pop();
  if (ALT_OVERRIDES[filename]) return ALT_OVERRIDES[filename];
  if (filename.startsWith("SCR-")) return "Merchant Dashboard screenshot";
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toFrame(alt, path, indent = "") {
  const altText = (alt || "").trim() || altFromPath(path);
  return `${indent}<Frame>\n${indent}  <img src="${path}" alt="${altText}" />\n${indent}</Frame>`;
}

function convertContent(content) {
  return content.replace(
    /!\[([^\]]*)\]\((\/images\/[^)]+)\)/g,
    (_, alt, path) => toFrame(alt, path, "")
  );
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
  if (!original.includes("![")) continue;
  const converted = convertContent(original);
  if (converted !== original) {
    writeFileSync(file, converted);
    updated += 1;
    console.log(file.replace(ROOT, ""));
  }
}

console.log(`Updated ${updated} files.`);
