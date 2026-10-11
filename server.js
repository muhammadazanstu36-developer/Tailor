// Small server: serves the app files and forwards chat messages to the Anthropic API.
// Run:  cd server && npm install && ANTHROPIC_API_KEY=your_key node server.js
// Then open http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-sonnet-5-5";
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
const hits = new Map(); // simple per-IP rate limit: 20 requests per minute

function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); hits.set(ip, arr); return arr.length > 20;
}

function readBody(req, max = 200000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > max) { reject(new Error("too large")); req.destroy(); } });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function handleAI(req, res) {
  const send = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (!KEY) return send(500, { error: "Set ANTHROPIC_API_KEY on the server." });
  if (limited(req.socket.remoteAddress)) return send(429, { error: "Too many requests" });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return send(400, { error: "Bad request" }); }
  const msgs = body && body.messages;
  const ok = Array.isArray(msgs) && msgs.length > 0 && msgs.length < 40 &&
    msgs.every(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") &&
    msgs[msgs.length - 1].role === "user" && msgs.reduce((n, m) => n + m.content.length, 0) < 60000;
  if (!ok) return send(400, { error: "Invalid messages" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: msgs })
    });
    const j = await r.json();
    if (!r.ok) return send(r.status === 429 ? 429 : 502, { error: (j.error && j.error.message) || "AI request failed" });
    send(200, { text: (j.content || []).filter(b => b.type === "text").map(b => b.text).join("") });
  } catch { send(502, { error: "AI request failed" }); }
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/ai" && req.method === "POST") return handleAI(req, res);
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, "");
  if (p === "/" || p === path.sep) p = "/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || file.startsWith(path.join(ROOT, "server"))) { res.writeHead(404); return res.end("Not found"); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(PORT, () => console.log("Job Tailor running on http://localhost:" + PORT));
