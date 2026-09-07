import { Hono } from "hono";
import { getAllConcepts, getConceptById } from "../services/content";

const conceptsRouter = new Hono();


// GET /api/concepts
conceptsRouter.get("/", (c) => {
  const concepts = getAllConcepts();

  return c.json({
    count: concepts.length,
    concepts
  });
});


// GET /api/concepts/:conceptId
conceptsRouter.get("/:conceptId", (c) => {
  const conceptId = c.req.param("conceptId");

  const concept = getConceptById(conceptId);

  if (!concept) {
    return c.json(
      {
        error: "Concept not found"
      },
      404
    );
  }

  return c.json(concept);
});


export default conceptsRouter;