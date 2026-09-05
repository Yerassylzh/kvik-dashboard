/**
 * export-translation-keys.mjs
 * ---------------------------
 * Collects ALL existing translation keys from `locales/<lang>/*.json` and writes
 * them (full dotted form: "<namespace>.<nested.path>", sorted), one key per line, to:
 *   - `locales/translation_keys_existing.txt` — every key, including `api.*`
 *   - `locales/backend_keys_existing.txt` — only the backend `api.*` keys (from api.json)
 *
 * The first segment of each key is the namespace and matches the JSON file name,
 * e.g. `locales/ru/onboarding.json` -> { "data_source": { "realty_label": ... } }
 * becomes the key "onboarding.data_source.realty_label".
 *
 * HOW TO RUN (from the project root):
 *   node scripts/export-translation-keys.mjs       # defaults to "ru"
 *   node scripts/export-translation-keys.mjs ru    # export keys from the ru locale
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCALES_DIR = path.join(ROOT, "locales");
const OUTPUT_FILE = path.join(LOCALES_DIR, "translation_keys_existing.txt");
const BACKEND_OUTPUT_FILE = path.join(LOCALES_DIR, "backend_keys_existing.txt");

const lang = process.argv[2] || "ru";
const langDir = path.join(LOCALES_DIR, lang);

if (!fs.existsSync(langDir)) {
  console.error(`Locale folder not found: locales/${lang}`);
  process.exit(1);
}

// Flatten nested JSON into full dotted keys.
function flatten(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flatten(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const keys = [];
const backendKeys = [];
for (const file of fs.readdirSync(langDir)) {
  if (!file.endsWith(".json")) continue;
  const namespace = path.basename(file, ".json");
  const data = JSON.parse(fs.readFileSync(path.join(langDir, file), "utf8"));
  if (namespace === "api") {
    backendKeys.push(...flatten(data, namespace));
  }
  keys.push(...flatten(data, namespace));
}

keys.sort();
fs.writeFileSync(OUTPUT_FILE, keys.join("\n") + "\n", "utf8");
backendKeys.sort();
fs.writeFileSync(BACKEND_OUTPUT_FILE, backendKeys.join("\n") + "\n", "utf8");
console.log(
  `Wrote ${keys.length} key(s) to translation_keys_existing.txt and ${backendKeys.length} backend key(s) to backend_keys_existing.txt (from locales/${lang}).`,
);
