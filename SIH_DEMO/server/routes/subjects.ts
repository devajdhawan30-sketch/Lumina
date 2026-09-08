import { Hono } from "hono";
import {
  getAllSubjects,
  getSubjectById
} from "../services/content";

const subjectsRouter = new Hono();


// GET /api/subjects
subjectsRouter.get("/", (c) => {
  const subjects = getAllSubjects();

  return c.json({
    count: subjects.length,
    subjects
  });
});


// GET /api/subjects/:subjectId
subjectsRouter.get("/:subjectId", (c) => {
  const subjectId = c.req.param("subjectId");

  const subject = getSubjectById(subjectId);

  if (!subject) {
    return c.json(
      {
        error: "Subject not found"
      },
      404
    );
  }

  return c.json(subject);
});


export default subjectsRouter;