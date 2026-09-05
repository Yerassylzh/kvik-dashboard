/**
 * apply-translation-keys.mjs
 * --------------------------
 * Merges new translation keys into the locale files under `locales/<lang>/`,
 * where <namespace> is the first segment of the dotted key
 * (e.g. "onboarding.data_source.realty_label" -> `locales/ru/onboarding.json`
 * under the nested path `data_source.realty_label`).
 *
 * TWO INPUT FILES:
 *   1. `locales/translation_keys_new.json` — frontend UI keys, merged into
 *      `locales/<lang>/<namespace>.json` by namespace.
 *   2. `locales/backend_new_keys.json` — backend response keys, merged into
 *      `locales/<lang>/api.json` (the axios-interceptor dictionary).
 *      A leading "api." segment on keys is optional and stripped automatically,
 *      so both "auth.invalid_credentials" and "api.auth.invalid_credentials" work.
 *
 * The default language is always `ru`. Values in the input files are Russian.
 * Input files are NEVER modified, and keys that already exist in the target
 * file are skipped, so this script is safe to re-run.
 *
 * HOW TO RUN (from the project root):
 *   node scripts/apply-translation-keys.mjs            # merge both files into locales/ru
 *   node scripts/apply-translation-keys.mjs kk         # merge into locales/kk instead
 *   node scripts/apply-translation-keys.mjs --dry-run  # preview without writing
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCALES_DIR = path.join(ROOT, "locales");
const FRONTEND_NEW_KEYS_FILE = path.join(LOCALES_DIR, "translation_keys_new.json");
const BACKEND_NEW_KEYS_FILE = path.join(LOCALES_DIR, "backend_new_keys.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const lang = args.find((a) => !a.startsWith("--")) || "ru";

const langDir = path.join(LOCALES_DIR, lang);
if (!fs.existsSync(langDir)) {
  console.error(`Locale folder not found: locales/${lang}`);
  process.exit(1);
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8").trim();
  return text ? JSON.parse(text) : {};
}

/**
 * Merges `{ fullDottedKey: value }` entries into `locales/<lang>/`.
 * `fixedNamespace` pins all keys to one namespace file (backend -> "api");
 * when null, the namespace is taken from the key's first segment.
 */
function mergeKeys(sourceFile, { fixedNamespace = null } = {}) {
  if (!fs.existsSync(sourceFile)) return;
  const entries = Object.entries(readJson(sourceFile));
  if (entries.length === 0) return;

  console.log(`\nMerging ${path.basename(sourceFile)}...`);
  let applied = 0;

  for (const [rawKey, value] of entries) {
    let parts = rawKey.split(".");
    if (fixedNamespace) {
      // Strip the optional namespace prefix ("api.auth.x" -> "auth.x").
      if (parts[0] === fixedNamespace && parts.length > 1) parts = parts.slice(1);
      parts = [fixedNamespace, ...parts];
    }
    if (parts.length < 2) {
      console.warn(`Skipping "${rawKey}": key must start with a namespace, e.g. "namespace.something"`);
      continue;
    }

    const [namespace, ...rest] = parts;
    const filePath = path.join(langDir, `${namespace}.json`);
    const fileData = fs.existsSync(filePath) ? readJson(filePath) : {};

    // Walk/create the nested path, then set the value.
    let node = fileData;
    for (const segment of rest.slice(0, -1)) {
      if (typeof node[segment] !== "object" || node[segment] === null) {
        node[segment] = {};
      }
      node = node[segment];
    }
    const leaf = rest[rest.length - 1];
    if (node[leaf] !== undefined) {
      console.warn(`Skipping "${rawKey}": already exists in locales/${lang}/${namespace}.json`);
      continue;
    }
    node[leaf] = value;

    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2) + "\n", "utf8");
    }
    applied++;
    console.log(`Applied "${rawKey}" -> locales/${lang}/${namespace}.json`);
  }

  console.log(`${applied} key(s) applied${dryRun ? " (dry-run, nothing written)" : ""}.`);
}

mergeKeys(FRONTEND_NEW_KEYS_FILE);
mergeKeys(BACKEND_NEW_KEYS_FILE, { fixedNamespace: "api" });
console.log(`\nDone: locales/${lang}${dryRun ? " (dry-run)" : ""}.`);
