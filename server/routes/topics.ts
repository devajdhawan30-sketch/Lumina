import { Hono } from "hono";
import {
  getAllTopics,
  getTopicById
} from "../services/content";

const topicsRouter = new Hono();


// GET /api/topics
topicsRouter.get("/", (c) => {
  const topics = getAllTopics();

  return c.json({
    count: topics.length,
    topics
  });
});


// GET /api/topics/:topicId
topicsRouter.get("/:topicId", (c) => {
  const topicId = c.req.param("topicId");

  const topic = getTopicById(topicId);

  if (!topic) {
    return c.json(
      {
        error: "Topic not found"
      },
      404
    );
  }

  return c.json(topic);
});


export default topicsRouter;