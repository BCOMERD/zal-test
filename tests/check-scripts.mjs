import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const dir = await mkdtemp(join(tmpdir(), "zal-check-"));
try {
  for (const name of ["app.html", "index.html", "Login.html"]) {
    const content = await readFile(
      new URL("../" + name, import.meta.url),
      "utf8",
    );
    if (content.startsWith("{\\rtf")) throw Error(name + " is RTF");
    let i = 0;
    for (const m of content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      if (!m[1].trim()) continue;
      const path = join(dir, i++ + ".js");
      await writeFile(path, m[1]);
      const r = spawnSync(process.execPath, ["--check", path], {
        encoding: "utf8",
      });
      if (r.status !== 0) throw Error(name + ": " + r.stderr);
    }
    console.log("PASS: " + name);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
