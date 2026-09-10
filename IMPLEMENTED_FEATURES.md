# Implemented in this build

## Interactive highlighted explorations
- Hovering a highlighted phrase opens its linked animated visualization.
- Multiple highlighted phrases in one paragraph are supported.
- Highlight actions can launch Ask Tutor and Why? prompts.
- The 12 exploration definitions are present in `client/src/data/explorations.ts`.
- The visualization implementations are in `client/src/components/ExplorationPopover.tsx`.
- `content/explorations/exploration.json` is populated with the exploration registry.
- All 12 exploration IDs have corresponding highlighted content in the concept JSONs.

## Subject roadmaps
- Every subject card in Explore has a `View complete roadmap` button.
- Added `/roadmap/subject/:subjectId`.
- Mathematics has a full graph-style roadmap inspired by the supplied reference image.
- Other subjects have a structured roadmap scaffold.
- Clicking a roadmap node opens a detail panel showing the lessons/topics for that node.
- The Trigonometry node loads the real concept library from the backend.

## AI Tutor
- Added Tutor / Socratic Mode switch.
- Socratic Mode asks the student to explain their reasoning, probes with one question at a time, avoids giving away answers prematurely, and provides a grasp assessment when appropriate.
- Added Socratic quick actions including a grasp assessment.

## Security
- The uploaded `server/.dev.vars` secret was not included in this output ZIP.
- Use `server/.dev.vars.example` to create your local `.dev.vars`.
