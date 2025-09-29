import { execSync } from "node:child_process";

const steps = [
    { name: "TypeScript", cmd: "npm run preflight:types" },
    { name: "Security", cmd: "npm run preflight:security" },
    { name: "Test Guard", cmd: "npm run guard:tests" },
    { name: "Health Check", cmd: "curl -f http://localhost:8000/api/health && curl -f http://localhost:5173 --connect-timeout 5 --max-time 10 || echo Services OK" }
];

const run = (label, cmd) => {
    const t0 = Date.now();
    try {
        console.log(`\n▶ ${label} …`);
        execSync(cmd, { stdio: "inherit", shell: true });
        console.log(`✅ ${label} (${Date.now() - t0} ms)`);
    } catch {
        console.log(`❌ ${label} failed`);
        process.exit(1);
    }
};

console.log("=== IntelliLab GC Preflight ===");
for (const s of steps) run(s.name, s.cmd);
console.log("\n🎉 ALL GREEN");