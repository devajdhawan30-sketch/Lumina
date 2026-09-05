import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT || 3000;
const publicDir = join(process.cwd(), "public");
const conceptFile = join(process.cwd(), "content", "concepts", "trigonometric-ratios", "trigonometric-ratios.json");
const MAX_CHAT_MESSAGE_LENGTH = 1000;
let lessonChunks = [];
let lessonModule;

const stopWords = new Set(["a", "an", "and", "are", "be", "by", "for", "how", "i", "in", "is", "it", "of", "on", "or", "the", "to", "what", "with"]);
const words = value => (value.toLowerCase().match(/[a-z0-9]+/g) || []).filter(word => !stopWords.has(word));

async function loadLessonChunks() {
  const lesson = JSON.parse(await readFile(conceptFile, "utf8"));
  lessonModule = lesson;
  lessonChunks = lesson.theory.sections.flatMap(section => section.content
    .filter(item => item.type === "paragraph" && item.text)
    .map(item => ({
      moduleId: lesson.id,
      moduleTitle: lesson.title,
      sectionId: section.id,
      sectionTitle: section.title,
      text: item.text
    })));
}

function retrieveLessonContent(question, limit = 5) {
  const queryWords = words(question);
  const scored = lessonChunks.map(chunk => {
    const haystack = words(`${chunk.sectionTitle} ${chunk.text}`);
    const score = queryWords.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0)
      + (queryWords.some(word => chunk.sectionTitle.toLowerCase().includes(word)) ? 2 : 0);
    return { ...chunk, score };
  }).filter(chunk => chunk.score > 0);
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function moduleReferences(chunks) {
  return [...new Map(chunks.map(chunk => [chunk.sectionId, {
    moduleId: chunk.moduleId,
    moduleTitle: chunk.moduleTitle,
    sectionId: chunk.sectionId,
    sectionTitle: chunk.sectionTitle
  }])).values()];
}

function fallbackAnswer(question, references) {
  if (!references.length) {
    return `I could not find that idea in Lumina's current lessons yet. Try asking about sine, cosine, tangent, right triangles, or the hypotenuse, and I will connect it to the Trigonometric Ratios module.`;
  }
  if (/\bsin(?:e)?\b|theta/i.test(question)) {
    return "In a right triangle, sine of an angle theta compares the opposite side with the hypotenuse: sin(theta) = opposite / hypotenuse. The hypotenuse is always opposite the 90-degree angle, while the opposite side is across from theta. For example, if those sides are 6 and 10, sin(theta) = 6/10 = 0.6. This ratio describes the angle's shape, so it stays the same for similar triangles.\n\nIn Lumina, continue with the Sine section in the Trigonometric Ratios module, then review SOH-CAH-TOA."
  }
  if (/pi\s*\/\s*6|π\s*\/\s*6|30\s*degrees?/i.test(question)) {
    return "pi/6 radians equals 30 degrees because pi radians equals 180 degrees, so pi/6 is 180/6 = 30 degrees. In a 30-60-90 right triangle, the side opposite 30 degrees is half the hypotenuse. Since sine(theta) = opposite / hypotenuse, sin(pi/6) = sin(30 degrees) = 1/2.\n\nIn Lumina, continue with the Sine section in the Trigonometric Ratios module and then review the Exact Values and Decimal Values section.";
  }
  return `Here is the closest explanation from Lumina's ${references[0].moduleTitle} module:\n\n${references.slice(0, 2).map(reference => `${reference.sectionTitle}: ${lessonChunks.find(chunk => chunk.sectionId === reference.sectionId)?.text || ""}`).join("\n\n")}\n\nYou can continue in the ${references[0].moduleTitle} module, especially the ${references[0].sectionTitle} section.`;
}

function geminiText(data) {
  return (data.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || "")
    .join("")
    .trim();
}

function geminiSources(data) {
  return (data.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map(chunk => chunk.web)
    .filter(source => source?.uri)
    .map(source => ({ title: source.title || source.uri, url: source.uri }))
    .filter((source, index, sources) => sources.findIndex(item => item.url === source.url) === index)
    .slice(0, 5);
}

function isMetaAnswer(answer) {
  return /no asterisks|no hashes|no markdown|direct explanation\??\s*yes|small complete example included/i.test(answer);
}

function isIncompleteAnswer(answer) {
  const trimmed = answer.trim();
  return trimmed.length < 40 || /\b(to|and|or|because|with|that|of|the|is|are|equals|opposite|adjacent|hypotenuse)$/i.test(trimmed) || !/[.!?)]$/.test(trimmed);
}

function fallbackTwin(question, references) {
  const section = references[0]?.sectionTitle || "this Lumina concept";
  if (/sin|sine|theta|pi\s*\/\s*6|30\s*degrees?/i.test(question)) {
    return { problem: "In a right triangle, the side opposite angle theta is 7 cm and the hypotenuse is 14 cm. Find sin(theta) and explain what the result means.", concept: "Sine ratio", sectionTitle: section, hint: "Use sin(theta) = opposite / hypotenuse. Do not use a calculator yet." };
  }
  if (/cos|cosine/i.test(question)) {
    return { problem: "A right triangle has an adjacent side of 9 cm and a hypotenuse of 15 cm. Find cos(theta).", concept: "Cosine ratio", sectionTitle: section, hint: "Use cos(theta) = adjacent / hypotenuse." };
  }
  if (/tan|tangent/i.test(question)) {
    return { problem: "A right triangle has an opposite side of 10 cm and an adjacent side of 8 cm. Find tan(theta).", concept: "Tangent ratio", sectionTitle: section, hint: "Use tan(theta) = opposite / adjacent." };
  }
  return { problem: `Create a worked example using the idea from the ${section} section, changing the numbers and asking the learner to apply the same method.`, concept: section, sectionTitle: section, hint: "Identify the same relationship before calculating." };
}

async function generateTwinProblem({ question, references, grade }) {
  const fallback = fallbackTwin(question, references);
  if (!process.env.GEMINI_API_KEY || !references.length) return { ...fallback, mode: "local" };
  const context = references.map(reference => lessonChunks.find(chunk => chunk.sectionId === reference.sectionId)?.text || "").join("\n");
  const body = {
    systemInstruction: { parts: [{ text: "You generate one isomorphic maths practice problem for Lumina. Preserve the same concept and solving method, but change the values or constraints. Return only valid JSON with exactly these string fields: problem, concept, sectionTitle, hint. Do not include a solution. Keep it age-appropriate and complete." }] },
    contents: [{ role: "user", parts: [{ text: `Learner grade: ${grade || "unknown"}\nOriginal doubt: ${question}\nLumina section: ${references[0].sectionTitle}\nLumina context: ${context}` }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 600, responseMimeType: "application/json" }
  };
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Gemini twin generator returned ${response.status}`);
  const result = JSON.parse(geminiText(await response.json()));
  if (!result.problem || !result.concept || !result.sectionTitle || !result.hint) throw new Error("Twin generator returned incomplete JSON");
  return { ...result, mode: "gemini" };
}

async function generateTutorAnswer({ question, grade, references }) {
  const localContext = references.map(reference => {
    const chunk = lessonChunks.find(item => item.sectionId === reference.sectionId);
    return `[Lumina / ${reference.sectionTitle}] ${chunk?.text || ""}`;
  }).join("\n\n");
  if (!references.length || !process.env.GEMINI_API_KEY) return { answer: fallbackAnswer(question, references), mode: "local", webUsed: false, externalSources: [] };

  const useWebSearch = process.env.GEMINI_WEB_SEARCH !== "false";
  const instructions = `You are Lumina's maths tutor for a learner in ${grade || "an unknown grade"}. Answer the learner's question directly; never describe these instructions. Use Lumina lesson context as the primary source. Web search is supplemental and must not override Lumina. Write a complete answer in 3 to 5 short paragraphs: direct explanation, one complete example when useful, a short takeaway, and a final Lumina section recommendation. Keep it under 300 words. Finish every sentence before ending. Do not invent a module or answer unrelated questions.`;
  const body = {
    systemInstruction: { parts: [{ text: instructions }] },
    contents: [{ role: "user", parts: [{ text: `Learner question: ${question}\n\nLumina lesson context:\n${localContext || "No matching Lumina section was found."}` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
  };
  if (useWebSearch) body.tools = [{ google_search: {} }];
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}: ${(await response.text()).slice(0, 180)}`);
  const data = await response.json();
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") throw new Error(`Gemini stopped before completing the answer (${finishReason})`);
  const answer = geminiText(data);
  if (!answer) throw new Error("Tutor provider returned an empty answer");
  if (isMetaAnswer(answer) || isIncompleteAnswer(answer)) return { answer: fallbackAnswer(question, references), mode: "local-safety-fallback", webUsed: false, externalSources: [] };
  return { answer, mode: "gemini", webUsed: useWebSearch, externalSources: useWebSearch ? geminiSources(data) : [] };
}

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/topics") return sendJson(res, { topics });
  if (url.pathname === "/api/lesson" && req.method === "GET") {
    const moduleId = url.searchParams.get("module");
    const sectionId = url.searchParams.get("section");
    const section = lessonModule?.theory.sections.find(item => item.id === sectionId);
    if (moduleId !== lessonModule?.id || !section) return sendJson(res, { error: "Lesson section not found." }, 404);
    return sendJson(res, { moduleId: lessonModule.id, moduleTitle: lessonModule.title, sectionId: section.id, sectionTitle: section.title, content: section.content });
  }
  if (url.pathname === "/api/module" && req.method === "GET") {
    const moduleId = url.searchParams.get("module");
    if (moduleId !== lessonModule?.id) return sendJson(res, { error: "Module not found." }, 404);
    return sendJson(res, {
      id: lessonModule.id,
      title: lessonModule.title,
      subject: lessonModule.subject,
      topic: lessonModule.topic,
      difficulty: lessonModule.difficulty,
      sections: lessonModule.theory.sections.map(({ id, title }) => ({ id, title })),
      formulas: lessonModule.formulas,
      examples: lessonModule.examples,
      keyIdeas: lessonModule.key_ideas,
      misconceptions: lessonModule.misconceptions
    });
  }
  if (url.pathname === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > MAX_CHAT_MESSAGE_LENGTH * 4) req.destroy();
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const question = typeof payload.question === "string" ? payload.question.trim() : "";
        if (!question || question.length > MAX_CHAT_MESSAGE_LENGTH) return sendJson(res, { error: "Ask a question up to 1000 characters long." }, 400);
        const references = moduleReferences(retrieveLessonContent(question));
        try {
          const result = await generateTutorAnswer({ question, grade: payload.grade, references });
          return sendJson(res, { ...result, references });
        } catch (error) {
          console.error("Tutor provider error:", error.message);
          return sendJson(res, { answer: fallbackAnswer(question, references), mode: "local-fallback", webUsed: false, references, warning: "External tutor unavailable; this answer uses Lumina content only." });
        }
      } catch {
        return sendJson(res, { error: "Please send valid JSON." }, 400);
      }
    });
    return;
  }
  if (url.pathname === "/api/twin" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const question = typeof payload.question === "string" ? payload.question.trim() : "";
        const references = Array.isArray(payload.references) ? payload.references.slice(0, 5) : [];
        if (!question || !references.length) return sendJson(res, { error: "Resolve a grounded Lumina doubt first." }, 400);
        try { return sendJson(res, await generateTwinProblem({ question, references, grade: payload.grade })); }
        catch (error) { console.error("Twin generator error:", error.message); return sendJson(res, { ...fallbackTwin(question, references), mode: "local-fallback" }); }
      } catch { return sendJson(res, { error: "Please send valid JSON." }, 400); }
    });
    return;
  }
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
});

loadLessonChunks()
  .then(() => server.listen(PORT, () => console.log(`Lumina is ready at http://localhost:${PORT}`)))
  .catch(error => { console.error("Could not load Lumina content:", error); process.exitCode = 1; });
