// Server xem thử thư mục dist/ — không cần cài thêm gói nào
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT || 4400;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[\\/])+/, "");
  if (path.endsWith("/") || path.endsWith("\\")) path += "index.html";
  try {
    const body = await readFile(join("dist", path));
    res.writeHead(200, { "content-type": (TYPES[extname(path)] || "application/octet-stream") + "; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
