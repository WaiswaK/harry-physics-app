const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "topics.json");

const seedTopics = require(dataFile);

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(seedTopics, null, 2));
  }
}

async function readTopics() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeTopics(topics) {
  await fs.writeFile(dataFile, JSON.stringify(topics, null, 2));
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildControlMap(controls = []) {
  return controls.reduce((map, control) => {
    map[control.id] = control.defaultValue;
    return map;
  }, {});
}

function validateQuestion(question, index) {
  if (!question.prompt || !Array.isArray(question.options) || question.options.length < 2) {
    return `Quiz question ${index + 1} needs a prompt and at least two options.`;
  }

  if (!question.answer || !question.options.includes(question.answer)) {
    return `Quiz question ${index + 1} must include an answer from its options.`;
  }

  return null;
}

function validateTopicInput(topic) {
  if (!topic.title || !topic.level || !topic.duration || !topic.summary) {
    return "Title, level, duration, and summary are required.";
  }

  if (!Array.isArray(topic.objectives) || topic.objectives.length === 0) {
    return "Each topic needs at least one learning objective.";
  }

  if (!topic.lesson?.overview) {
    return "Each topic needs lesson overview content.";
  }

  if (!Array.isArray(topic.lesson?.concepts) || topic.lesson.concepts.length === 0) {
    return "Each topic needs lesson concepts.";
  }

  if (!Array.isArray(topic.lesson?.activities) || topic.lesson.activities.length === 0) {
    return "Each topic needs lesson activities.";
  }

  if (!topic.simulation?.type || !topic.simulation?.title || !topic.simulation?.description) {
    return "Each topic needs simulation type, title, and description.";
  }

  if (!Array.isArray(topic.simulation?.controls) || topic.simulation.controls.length === 0) {
    return "Each topic needs simulation controls.";
  }

  if (!topic.quiz?.title || !Array.isArray(topic.quiz?.questions) || topic.quiz.questions.length === 0) {
    return "Each topic needs quiz content.";
  }

  for (const [index, question] of topic.quiz.questions.entries()) {
    const error = validateQuestion(question, index);
    if (error) {
      return error;
    }
  }

  return null;
}

function normalizeTopicInput(input, existingId) {
  const slug = slugify(input.slug || input.title || existingId || crypto.randomUUID());
  const topicId = existingId || slug || crypto.randomUUID();

  const simulationControls = Array.isArray(input.simulation?.controls)
    ? input.simulation.controls.map((control) => ({
        id: control.id,
        label: control.label,
        unit: control.unit,
        min: Number(control.min),
        max: Number(control.max),
        step: Number(control.step || 1),
        defaultValue: Number(control.defaultValue),
      }))
    : [];

  return {
    id: topicId,
    slug,
    title: input.title.trim(),
    level: input.level.trim(),
    duration: input.duration.trim(),
    category: (input.category || "General Physics").trim(),
    summary: input.summary.trim(),
    objectives: input.objectives.map((item) => item.trim()).filter(Boolean),
    lesson: {
      overview: input.lesson.overview.trim(),
      concepts: input.lesson.concepts.map((item) => item.trim()).filter(Boolean),
      activities: input.lesson.activities.map((item) => item.trim()).filter(Boolean),
    },
    simulation: {
      type: input.simulation.type.trim(),
      title: input.simulation.title.trim(),
      description: input.simulation.description.trim(),
      formulaNote: (input.simulation.formulaNote || "").trim(),
      controls: simulationControls,
      defaults: buildControlMap(simulationControls),
    },
    quiz: {
      title: input.quiz.title.trim(),
      questions: input.quiz.questions.map((question, index) => ({
        id: Number(question.id) || index + 1,
        prompt: question.prompt.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
        answer: question.answer.trim(),
        explanation: question.explanation.trim(),
      })),
    },
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  readTopics,
  writeTopics,
  validateTopicInput,
  normalizeTopicInput,
};
