import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDir = resolve(root, "public");
const outDir = resolve(root, "dist");
const logoSource = "https://raw.githubusercontent.com/masalaempire/OnTimely/c7035e83eba80db53e5b2a87076c6c8fdb2b25e0/Design/OnTimely-icon-master.png";

// Build with Node alone. Keep the published logo on the website's own host.
await mkdir(outDir, { recursive: true });
await cp(publicDir, outDir, { recursive: true });
await mkdir(resolve(outDir, "assets"), { recursive: true });
const response = await fetch(logoSource, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error("Logo download failed: " + response.status);
const bytes = new Uint8Array(await response.arrayBuffer());
const signature = [137, 80, 78, 71, 13, 10, 26, 10];
if (!signature.every((byte, index) => bytes[index] === byte)) {
  throw new Error("The app logo is not a PNG.");
}
await writeFile(resolve(outDir, "assets/ontimely.png"), bytes);
for (const page of ["index.html", "404.html"]) {
  const path = resolve(outDir, page);
  const html = await readFile(path, "utf8");
  await writeFile(path, html.replaceAll(logoSource, "./assets/ontimely.png"));
}
console.log("Built OnTimely website in dist with the app logo.");
