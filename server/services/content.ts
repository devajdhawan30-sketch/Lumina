import angles from "../../content/concepts/introduction-to-trigonometry/02-angles.json";
import angleMeasurement from "../../content/concepts/introduction-to-trigonometry/03-angle-measurement.json";
import degreesAndRadians from "../../content/concepts/introduction-to-trigonometry/04-degrees-and-radians.json";
import anglesOnACircle from "../../content/concepts/introduction-to-trigonometry/05-angles-on-a-circle.json";
import clockAndRotation from "../../content/concepts/introduction-to-trigonometry/06-clock-and-rotation.json";
import rightTriangles from "../../content/concepts/introduction-to-trigonometry/07-right-triangles.json";
import similarTriangles from "../../content/concepts/introduction-to-trigonometry/08-similar-triangles.json";
import bridgeToTrigRatios from "../../content/concepts/introduction-to-trigonometry/09-bridge-to-trig-ratios.json";

import trigonometricRatios from "../../content/concepts/trigonometric-ratios/01_trigonometric-ratios.json";
import reciprocalTrigonometricRatios from "../../content/concepts/trigonometric-ratios/02_reciprocal-trigonometric-ratios.json";
import trigonometricRatiosAnyAngle from "../../content/concepts/trigonometric-ratios/03_trigonometric-ratios-any-angle.json";
import exactTrigonometricValues from "../../content/concepts/trigonometric-ratios/04_exact-trigonometric-values.json";
import tangentFunction from "../../content/concepts/trigonometric-ratios/05_tangent-function.json";
import sineFunction from "../../content/concepts/trigonometric-ratios/06_sine-function.json";
import cosineFunction from "../../content/concepts/trigonometric-ratios/07_cosine-function.json";
import trigonometricFunctions from "../../content/concepts/trigonometric-ratios/08_trigonometric-functions.json";
import reciprocalTrigonometricFunctions from "../../content/concepts/trigonometric-ratios/09_reciprocal-trigonometric-functions.json";
import rightTriangleTrigonometry from "../../content/concepts/trigonometric-ratios/10_right-triangle-trigonometry.json";

import whatAreTrigEquations from "../../content/concepts/trigonometricFunctions/trig-equations-01-what-are-equations.json";
import natureOfSolutions from "../../content/concepts/trigonometricFunctions/trig-equations-02-nature-of-solutions.json";
import basicTrigEquations from "../../content/concepts/trigonometricFunctions/trig-equations-03-basic-equations.json";
import reciprocalFunctionEquations from "../../content/concepts/trigonometricFunctions/trig-equations-04-reciprocal-function-equations.json";
import factoringTrigEquations from "../../content/concepts/trigonometricFunctions/trig-equations-05-factoring.json";
import quadraticTrigEquations from "../../content/concepts/trigonometricFunctions/trig-equations-06-quadratic-equation.json";
import identityTrigEquations from "../../content/concepts/trigonometricFunctions/trig-equations-07-identities.json";
import multipleCompositeEquations from "../../content/concepts/trigonometricFunctions/trig-equations-08-multipleAndCompostite.json";
import restrictedInterval from "../../content/concepts/trigonometricFunctions/trig-equations-09-RestrictedInterval.json";
import extraneousSolutions from "../../content/concepts/trigonometricFunctions/trig-equations-10-extraneousSolutions.json";
import generalSolution from "../../content/concepts/trigonometricFunctions/trig-equations-11-generalSolution.json";

import applicationsOfTrigonometry from "../../content/concepts/applicationOfTrigo/application-trigo.json";


const concepts = [
  // Introduction to Trigonometry
  angles,
  angleMeasurement,
  degreesAndRadians,
  anglesOnACircle,
  clockAndRotation,
  rightTriangles,
  similarTriangles,
  bridgeToTrigRatios,

  // Trigonometric Ratios and Functions
  trigonometricRatios,
  reciprocalTrigonometricRatios,
  trigonometricRatiosAnyAngle,
  exactTrigonometricValues,
  tangentFunction,
  sineFunction,
  cosineFunction,
  trigonometricFunctions,
  reciprocalTrigonometricFunctions,
  rightTriangleTrigonometry,

  // Trigonometric Equations
  whatAreTrigEquations,
  natureOfSolutions,
  basicTrigEquations,
  reciprocalFunctionEquations,
  factoringTrigEquations,
  quadraticTrigEquations,
  identityTrigEquations,
  multipleCompositeEquations,
  restrictedInterval,
  extraneousSolutions,
  generalSolution,

  // Applications
  applicationsOfTrigonometry
];


export function getAllConcepts() {
  return concepts;
}


export function getConceptById(id: string) {
  return concepts.find((concept) => concept.id === id);
}


export function getAllSubjects() {
  const subjects = new Map<string, {
    id: string;
    title: string;
    conceptCount: number;
  }>();

  for (const concept of concepts) {
    const subjectId = concept.subject;

    if (!subjects.has(subjectId)) {
      subjects.set(subjectId, {
        id: subjectId,
        title: formatTitle(subjectId),
        conceptCount: 0
      });
    }

    subjects.get(subjectId)!.conceptCount++;
  }

  return Array.from(subjects.values());
}


export function getSubjectById(subjectId: string) {
  const subjectConcepts = concepts.filter(
    (concept) => concept.subject === subjectId
  );

  if (subjectConcepts.length === 0) {
    return undefined;
  }

  const topics = new Map<string, {
    id: string;
    title: string;
    conceptCount: number;
  }>();

  for (const concept of subjectConcepts) {
    const topicId = concept.topic;

    if (!topics.has(topicId)) {
      topics.set(topicId, {
        id: topicId,
        title: formatTitle(topicId),
        conceptCount: 0
      });
    }

    topics.get(topicId)!.conceptCount++;
  }

  return {
    id: subjectId,
    title: formatTitle(subjectId),
    conceptCount: subjectConcepts.length,
    topics: Array.from(topics.values())
  };
}


export function getAllTopics() {
  const topics = new Map<string, {
    id: string;
    title: string;
    subject: string;
    conceptCount: number;
  }>();

  for (const concept of concepts) {
    const topicId = concept.topic;

    if (!topics.has(topicId)) {
      topics.set(topicId, {
        id: topicId,
        title: formatTitle(topicId),
        subject: concept.subject,
        conceptCount: 0
      });
    }

    topics.get(topicId)!.conceptCount++;
  }

  return Array.from(topics.values());
}


export function getTopicById(topicId: string) {
  const topicConcepts = concepts.filter(
    (concept) => concept.topic === topicId
  );

  if (topicConcepts.length === 0) {
    return undefined;
  }

  return {
    id: topicId,
    title: formatTitle(topicId),
    subject: topicConcepts[0].subject,
    conceptCount: topicConcepts.length,
    concepts: topicConcepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      difficulty: concept.difficulty
    }))
  };
}


function formatTitle(id: string) {
  return id
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}


export function getRoadmapByTopic(topicId: string) {
  const topicConcepts = concepts.filter(
    (concept) => concept.topic === topicId
  );

  if (topicConcepts.length === 0) {
    return undefined;
  }

  const conceptIds = new Set(
    topicConcepts.map((concept) => concept.id)
  );

  const nodes = topicConcepts.map((concept) => ({
    id: concept.id,
    title: concept.title,
    difficulty: concept.difficulty
  }));

  const edges: {
    from: string;
    to: string;
    type: "prerequisite" | "leads_to" | "related";
  }[] = [];

  for (const concept of topicConcepts) {

    for (const prerequisite of concept.connections.prerequisites) {
      if (conceptIds.has(prerequisite)) {
        edges.push({
          from: prerequisite,
          to: concept.id,
          type: "prerequisite"
        });
      }
    }

    for (const leadsTo of concept.connections.leads_to) {
      if (conceptIds.has(leadsTo)) {
        edges.push({
          from: concept.id,
          to: leadsTo,
          type: "leads_to"
        });
      }
    }

    for (const related of concept.connections.related) {
      if (conceptIds.has(related)) {
        edges.push({
          from: concept.id,
          to: related,
          type: "related"
        });
      }
    }
  }

  return {
    topic: {
      id: topicId,
      title: formatTitle(topicId)
    },
    nodes,
    edges
  };
}


export function getContentElement(
  conceptId: string,
  contentId: string
) {
  const concept = getConceptById(conceptId);

  if (!concept) {
    return undefined;
  }

  for (const section of concept.theory.sections) {
    for (const element of section.content) {
      if ("id" in element && element.id === contentId) {
        return {
          sectionTitle: section.title,
          element
        };
      }
    }
  }

  return undefined;
}