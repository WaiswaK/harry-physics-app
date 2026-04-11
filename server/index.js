const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  dbFile,
  ensureDatabase,
  getTopicSummaries,
  getTopicById,
  saveTopic,
  deleteTopic,
  getUserByUsername,
  getSafeUserById,
  createSession,
  getUserByToken,
  deleteSession,
  upsertLessonProgress,
  recordQuizAttempt,
  getStudentProgress,
  getAllStudentProgress,
  validateTopicInput,
  hashPassword,
} = require("./database");

ensureDatabase();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function authRequired(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ error: "Login required." });
  }

  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  req.user = user;
  req.token = token;
  return next();
}

function adminRequired(req, res, next) {
  return authRequired(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Administrator access required." });
    }

    return next();
  });
}

app.get("/api/hello", (req, res) => {
  const topics = getTopicSummaries();

  res.json({
    message: "Harry Physics API is ready with lessons, progress tracking, and admin management.",
    timestamp: new Date().toISOString(),
    modules: ["topics", "student-progress", "auth", "admin-portal"],
    topicCount: topics.length,
    database: dbFile,
  });
});

app.get("/api/topics", (req, res) => {
  res.json(getTopicSummaries());
});

app.get("/api/topics/:id", (req, res) => {
  const topic = getTopicById(req.params.id);

  if (!topic) {
    return res.status(404).json({ error: "Topic not found." });
  }

  return res.json(topic);
});

app.post("/api/auth/login", (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = getUserByUsername(username);

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = createSession(user.id);
  return res.json({
    token,
    user: getSafeUserById(user.id),
  });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", authRequired, (req, res) => {
  deleteSession(req.token);
  res.status(204).send();
});

app.get("/api/progress/me", authRequired, (req, res) => {
  if (req.user.role !== "student") {
    return res.json({ progress: [] });
  }

  return res.json({ progress: getStudentProgress(req.user.id) });
});

app.post("/api/progress/lesson-complete", authRequired, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Only student accounts track lesson progress." });
  }

  const topic = getTopicById(req.body?.topicId);
  if (!topic) {
    return res.status(404).json({ error: "Topic not found." });
  }

  upsertLessonProgress(req.user.id, topic.id, { lessonCompleted: 1 });
  return res.status(204).send();
});

app.post("/api/quizzes/:topicId/submit", authRequired, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Quiz submission is only available to student accounts." });
  }

  const topic = getTopicById(req.params.topicId);
  if (!topic) {
    return res.status(404).json({ error: "Topic not found." });
  }

  const answers = req.body?.answers;
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Quiz answers are required." });
  }

  const score = topic.quiz.questions.reduce((total, question) => {
    return total + (answers[question.id] === question.answer ? 1 : 0);
  }, 0);

  recordQuizAttempt(req.user.id, topic.id, answers, score, topic.quiz.questions.length);

  return res.json({
    score,
    total: topic.quiz.questions.length,
    feedback: topic.quiz.questions.map((question) => ({
      questionId: question.id,
      correctAnswer: question.answer,
      explanation: question.explanation,
      isCorrect: answers[question.id] === question.answer,
    })),
  });
});

app.get("/api/admin/students", adminRequired, (req, res) => {
  res.json({ students: getAllStudentProgress() });
});

app.post("/api/admin/topics", adminRequired, (req, res) => {
  const validationError = validateTopicInput(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const topic = saveTopic(req.body, "create");
    return res.status(201).json(topic);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "A topic with that title or slug already exists." });
    }

    throw error;
  }
});

app.put("/api/admin/topics/:id", adminRequired, (req, res) => {
  const validationError = validateTopicInput(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const existing = getTopicById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Topic not found." });
  }

  try {
    const topic = saveTopic({ ...req.body, id: existing.id }, "update");
    return res.json(topic);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Another topic already uses that title or slug." });
    }

    throw error;
  }
});

app.delete("/api/admin/topics/:id", adminRequired, (req, res) => {
  const existing = getTopicById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Topic not found." });
  }

  deleteTopic(existing.id);
  res.status(204).send();
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong in the API." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
