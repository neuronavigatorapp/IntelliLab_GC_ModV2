import { globby } from "globby";
import { readFileSync } from "node:fs";

const files = await globby(["tests/**/*.spec.ts", "tests/**/*.spec.tsx"]);
const offenders = [];
for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (/\.(only|skip)\s*\(/.test(src)) offenders.push(f);
}
if (offenders.length) {
    console.error("❌ test.only/test.skip found in:");
    offenders.forEach(f => console.error(" - " + f));
    process.exit(1);
} else {
    console.log("✅ No test.only/skip detected");
}