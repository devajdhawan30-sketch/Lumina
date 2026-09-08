import { Hono } from "hono";
import { getRoadmapByTopic } from "../services/content";

const roadmapRouter = new Hono();


// GET /api/roadmap/:topicId
roadmapRouter.get("/:topicId", (c) => {
  const topicId = c.req.param("topicId");

  const roadmap = getRoadmapByTopic(topicId);

  if (!roadmap) {
    return c.json(
      {
        error: "Topic not found"
      },
      404
    );
  }

  return c.json(roadmap);
});


export default roadmapRouter;