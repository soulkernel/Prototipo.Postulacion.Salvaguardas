// Read-only checks against the deployed portal. No cookies or credentials.
const base = "https://glf-postulaciones.vercel.app";
const paths = ["/", "/login", "/register", "/icon.svg", "/applicant", "/applicant/applications", "/applicant/guide", "/internal", "/internal/calls", "/internal/users", "/internal/reports", "/internal/evidence", "/internal/backups", "/security", "/demo"];
let failures = 0;
await Promise.all(paths.map(async (path) => {
  const response = await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  const location = response.headers.get("location");
  const publicRoute = ["/", "/login", "/register", "/icon.svg"].includes(path);
  const valid = publicRoute ? response.status === 200 : response.status >= 300 && response.status < 400 && (location === "/" || location?.startsWith("/login"));
  if (!valid) failures++;
  console.log(JSON.stringify({ path, status: response.status, location, valid }));
}));
for (const path of ["/api/files", "/api/corpus", "/internal/backups/export"]) {
  const response = await fetch(base + path, { method: "POST", headers: { "Origin": base, "Content-Type": "application/json" }, body: "{}", redirect: "manual", signal: AbortSignal.timeout(20000) });
  const valid = [401, 403].includes(response.status);
  if (!valid) failures++;
  console.log(JSON.stringify({ path, status: response.status, valid }));
}
process.exitCode = failures ? 1 : 0;
