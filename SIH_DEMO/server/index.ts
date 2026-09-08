import { Hono } from "hono";

import conceptsRouter from "./routes/concepts";
import subjectsRouter from "./routes/subjects";
import topicsRouter from "./routes/topics";
import aiRouter from "./routes/ai";
import roadmapRouter from "./routes/roadmap";

const app = new Hono();


// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "SIH backend is running"
  });
});


// Content routes
app.route("/api/concepts", conceptsRouter);
app.route("/api/subjects", subjectsRouter);
app.route("/api/topics", topicsRouter);
app.route("/api/roadmap", roadmapRouter);
app.route("/api/ai", aiRouter);

export default app;