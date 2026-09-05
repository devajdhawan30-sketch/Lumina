# Lumina — Maths learning roadmap demo

Lumina helps a learner move from curiosity to a clear, prerequisite-aware maths path. This demo covers Grade 6 through Calculus I, with a polished single-page interface and a small zero-dependency Node API.

## Run it

```powershell
npm start
```

Open `http://localhost:3000`.

## Tutor chatbot

The **Ask Lumina** section is integrated into the main page. It retrieves matching sections from `content/concepts/` first and returns module-aware answers with lesson references. It works without credentials using a deterministic local fallback for the current curriculum.

For richer explanations and optional web context, set a Gemini API key on the server before starting:

```powershell
$env:GEMINI_API_KEY="your-key"
$env:GEMINI_MODEL="gemini-3.6-flash" # optional
$env:GEMINI_WEB_SEARCH="true" # optional; defaults to true when a key is present
npm start
```

The browser never receives the API key. The server calls Gemini only after finding matching Lumina lesson context, supplies those sections to the model, and optionally enables Google Search grounding as supplemental context. Questions outside the current Lumina content stay on the local supported-topic response instead of receiving an unrelated generic answer. Web citations are shown below an answer when Gemini returns them. Add approved book or page content to `content/sources/` as it becomes available; Lumina content remains the source of truth for module names and learning sequence. n8n is not required for the request path, but can be added later for scheduled source ingestion or moderation workflows.

The chat API is `POST /api/chat`:

```json
{
  "question": "What is sine theta?",
  "grade": "10"
}
```

It returns an `answer`, `mode`, `webUsed`, structured Lumina `references`, and an `externalSources` array when web search citations are available. Keep provider keys in environment variables and never commit them to the repository.

## What is implemented

- Learner intake: grade, subject (Maths in this demo), target topic, and optional learning motivation.
- A `/api/topics` endpoint that supplies target-topic choices.
- A `/api/roadmap` endpoint that calculates the shortest valid prerequisite route from a learner's grade baseline to their goal.
- An animated visual roadmap with study estimates, scope labels, tags, and a recommended first lesson.
- Responsive design for desktop and mobile.

## Product structure: how to evolve this into the platform

```text
Student app
  ├─ Onboarding: grade, subject, current confidence, destination
  ├─ Roadmap: prerequisite graph + progress + next lesson
  ├─ Lesson player: explanation, visual, practice, reflection
  └─ Discovery: curiosity prompts and adjacent concepts

API / learning engine
  ├─ Learner profile + progress service
  ├─ Curriculum graph service (topics, prerequisites, alternatives)
  ├─ Roadmap engine (path generation + difficulty adaptation)
  ├─ Content service (lessons, practice, media)
  └─ Assessment service (mastery signals and recommendations)

Data
  ├─ Topic nodes: level, concepts, estimated time, content IDs
  ├─ Directed prerequisite edges: required / recommended / optional
  ├─ Learner progress: completed nodes, confidence, assessment results
  └─ Content assets: lessons, questions, worked examples, visuals
```

## Recommended implementation sequence

1. **Validate the map.** Have maths educators curate a first graph (roughly 80–150 nodes) and tag each edge as required, recommended, or optional.
2. **Make every node teachable.** Build a repeatable lesson template: intuition, interactive visual, worked examples, short practice, and a mastery check.
3. **Persist the learner.** Add authentication, topic completion, diagnostic results, and revisit recommendations. PostgreSQL is a good fit for profiles and progress; a graph-capable query layer or recursive SQL can power dependencies.
4. **Adapt responsibly.** Use quick diagnostics to skip mastered prerequisites, and always let learners inspect or override why a topic was suggested.
5. **Expand deliberately.** Add branches such as Statistics and Geometry before adding new subjects. The graph and content model should remain subject-agnostic from day one.

## Demo architecture

`server.js` contains the HTTP server, seeded curriculum graph and shortest-path roadmap engine. `public/index.html`, `public/styles.css`, and `public/app.js` are the frontend. The graph is intentionally in memory for a portable demo; the HTTP boundary allows it to move to a database without changing the interface.
