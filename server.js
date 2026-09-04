import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT || 3000;
const publicDir = join(process.cwd(), "public");

// In production this graph belongs in a database / content service. Keeping it
// here makes the demo deterministic while the API boundary stays the same.
const topics = [
  { id: "number-sense", title: "Number sense & factors", level: "Grade 6", kind: "foundation", mins: 75, tags: ["Numbers", "Arithmetic"], desc: "Build fluency with factors, multiples, primes and divisibility." },
  { id: "fractions", title: "Fractions, decimals & percentages", level: "Grade 6", kind: "foundation", mins: 100, tags: ["Numbers", "Arithmetic"], desc: "Move flexibly between parts, ratios, decimals and percentages." },
  { id: "ratios", title: "Ratios & proportional reasoning", level: "Grade 6–7", kind: "foundation", mins: 90, tags: ["Pre-algebra"], desc: "Compare quantities and recognise multiplicative relationships." },
  { id: "integers", title: "Integers & rational numbers", level: "Grade 7", kind: "foundation", mins: 85, tags: ["Numbers", "Pre-algebra"], desc: "Work confidently with signed numbers on a number line." },
  { id: "expressions", title: "Algebraic expressions", level: "Grade 7–8", kind: "core", mins: 110, tags: ["Algebra"], desc: "Translate patterns into variables, terms and equivalent expressions." },
  { id: "linear-equations", title: "Linear equations", level: "Grade 8", kind: "core", mins: 120, tags: ["Algebra"], desc: "Solve one-variable equations and understand balance." },
  { id: "coordinate-plane", title: "Coordinate geometry", level: "Grade 8", kind: "core", mins: 80, tags: ["Geometry", "Algebra"], desc: "Plot, interpret and connect points in the Cartesian plane." },
  { id: "functions", title: "Functions & graphs", level: "Grade 9", kind: "core", mins: 130, tags: ["Algebra", "Functions"], desc: "See mathematics as inputs, outputs, rules and representations." },
  { id: "polynomials", title: "Polynomials & factoring", level: "Grade 9–10", kind: "core", mins: 120, tags: ["Algebra"], desc: "Manipulate polynomial expressions and uncover their structure." },
  { id: "quadratics", title: "Quadratic functions", level: "Grade 10", kind: "core", mins: 140, tags: ["Algebra", "Functions"], desc: "Model parabolas, roots and maximum/minimum values." },
  { id: "triangles", title: "Triangles & trigonometry", level: "Grade 10", kind: "core", mins: 150, tags: ["Geometry", "Trigonometry"], desc: "Use similarity and trig ratios to reason about shape and distance." },
  { id: "exponentials", title: "Exponential & logarithmic functions", level: "Grade 11", kind: "bridge", mins: 145, tags: ["Functions"], desc: "Explore fast growth, inverse operations and models." },
  { id: "limits", title: "Limits & continuity", level: "Grade 11–12", kind: "bridge", mins: 135, tags: ["Calculus"], desc: "Describe what values approach and why smoothness matters." },
  { id: "derivatives", title: "Derivatives", level: "Calculus I", kind: "destination", mins: 180, tags: ["Calculus"], desc: "Measure instantaneous change and optimise real situations." },
  { id: "integrals", title: "Integrals", level: "Calculus I", kind: "destination", mins: 190, tags: ["Calculus"], desc: "Accumulate quantities and connect area to change." }
];

const edges = [
  ["number-sense", "fractions"], ["fractions", "ratios"], ["ratios", "integers"],
  ["integers", "expressions"], ["expressions", "linear-equations"], ["linear-equations", "coordinate-plane"],
  ["coordinate-plane", "functions"], ["functions", "polynomials"], ["polynomials", "quadratics"],
  ["quadratics", "exponentials"], ["functions", "triangles"], ["exponentials", "limits"],
  ["limits", "derivatives"], ["derivatives", "integrals"]
];

const gradeStarts = { "6": "number-sense", "7": "integers", "8": "expressions", "9": "functions", "10": "quadratics", "11": "exponentials", "12": "limits", university: "limits" };

function ancestors(target) {
  const found = new Set([target]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [from, to] of edges) {
      if (found.has(to) && !found.has(from)) { found.add(from); changed = true; }
    }
  }
  return found;
}

function pathFrom(start, target) {
  const allowed = ancestors(target);
  const queue = [[start]];
  const seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift(); const last = path.at(-1);
    if (last === target) return path;
    for (const [from, to] of edges) {
      if (from === last && allowed.has(to) && !seen.has(to)) { seen.add(to); queue.push([...path, to]); }
    }
  }
  return [start, target];
}

function roadmap({ grade = "6", topic = "derivatives", interest = "" }) {
  const start = gradeStarts[grade] || "number-sense";
  const target = topics.some(t => t.id === topic) ? topic : "derivatives";
  let path = pathFrom(start, target);
  if (path.length === 2 && start !== target && !edges.some(e => e[0] === start && e[1] === target)) {
    path = pathFrom("number-sense", target);
  }
  const nodes = path.map((id, index) => ({ ...topics.find(t => t.id === id), status: index === 0 ? "start" : id === target ? "target" : "next", order: index + 1 }));
  return { learner: { grade, interest }, target, nodes, edges: edges.filter(([from, to]) => path.includes(from) && path.includes(to)), estimate: nodes.reduce((n, t) => n + t.mins, 0), message: `Your path starts with ${nodes[0].title} and builds toward ${nodes.at(-1).title}.` };
}

const typeMap = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const sendJson = (res, data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/topics") return sendJson(res, { topics });
  if (url.pathname === "/api/roadmap" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => { try { sendJson(res, roadmap(JSON.parse(body || "{}"))); } catch { sendJson(res, { error: "Please send valid JSON." }, 400); } });
    return;
  }
  const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = normalize(join(publicDir, requested));
  if (!file.startsWith(publicDir)) { res.writeHead(403); return res.end("Forbidden"); }
  try { const content = await readFile(file); res.writeHead(200, { "Content-Type": typeMap[extname(file)] || "application/octet-stream" }); res.end(content); }
  catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); }
}).listen(PORT, () => console.log(`Lumina is ready at http://localhost:${PORT}`));
