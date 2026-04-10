const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  readTopics,
  writeTopics,
  validateTopicInput,
  normalizeTopicInput,
} = require("./contentStore");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/hello", async (req, res) => {
  const topics = await readTopics();

  res.json({
    message: "Harry Physics API is ready for lessons, simulations, quizzes, and admin content entry.",
    timestamp: new Date().toISOString(),
    modules: ["topics", "simulations", "quiz-feedback", "admin-content"],
    topicCount: topics.length,
  });
});

app.get("/api/topics", async (req, res) => {
  const topics = await readTopics();

  res.json(
    topics.map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      level: topic.level,
      duration: topic.duration,
      category: topic.category,
      summary: topic.summary,
      objectives: topic.objectives,
      simulationType: topic.simulation.type,
      quizCount: topic.quiz.questions.length,
    })),
  );
});

app.get("/api/topics/:id", async (req, res) => {
  const topics = await readTopics();
  const topic = topics.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);

  if (!topic) {
    return res.status(404).json({ error: "Topic not found." });
  }

  return res.json(topic);
});

app.post("/api/topics", async (req, res) => {
  const validationError = validateTopicInput(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const topics = await readTopics();
  const topic = normalizeTopicInput(req.body);
  const duplicate = topics.some(
    (entry) => entry.id === topic.id || entry.slug === topic.slug || entry.title === topic.title,
  );

  if (duplicate) {
    return res.status(409).json({ error: "A topic with that title or slug already exists." });
  }

  const nextTopics = [...topics, topic];
  await writeTopics(nextTopics);
  return res.status(201).json(topic);
});

app.put("/api/topics/:id", async (req, res) => {
  const validationError = validateTopicInput(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const topics = await readTopics();
  const index = topics.findIndex((entry) => entry.id === req.params.id || entry.slug === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Topic not found." });
  }

  const updatedTopic = normalizeTopicInput(req.body, topics[index].id);
  const hasConflict = topics.some(
    (entry, entryIndex) =>
      entryIndex !== index &&
      (entry.slug === updatedTopic.slug || entry.title === updatedTopic.title),
  );

  if (hasConflict) {
    return res.status(409).json({ error: "Another topic already uses that title or slug." });
  }

  const nextTopics = [...topics];
  nextTopics[index] = {
    ...topics[index],
    ...updatedTopic,
  };

  await writeTopics(nextTopics);
  return res.json(nextTopics[index]);
});

app.delete("/api/topics/:id", async (req, res) => {
  const topics = await readTopics();
  const nextTopics = topics.filter(
    (entry) => entry.id !== req.params.id && entry.slug !== req.params.id,
  );

  if (nextTopics.length === topics.length) {
    return res.status(404).json({ error: "Topic not found." });
  }

  await writeTopics(nextTopics);
  return res.status(204).send();
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong in the API." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
