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

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

const authRequired = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ error: "Login required." });
  }

  const user = await getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  req.user = user;
  req.token = token;
  return next();
});

const adminRequired = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ error: "Login required." });
  }

  const user = await getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required." });
  }

  req.user = user;
  req.token = token;
  return next();
});

app.get(
  "/api/hello",
  asyncHandler(async (req, res) => {
    const topics = await getTopicSummaries();

    res.json({
      message: "Harry Physics API is ready with PostgreSQL lessons, progress tracking, and admin management.",
      timestamp: new Date().toISOString(),
      modules: ["topics", "student-progress", "auth", "admin-portal"],
      topicCount: topics.length,
      database: dbFile,
    });
  }),
);

app.get(
  "/api/topics",
  asyncHandler(async (req, res) => {
    res.json(await getTopicSummaries());
  }),
);

app.get(
  "/api/topics/:id",
  asyncHandler(async (req, res) => {
    const topic = await getTopicById(req.params.id);

    if (!topic) {
      return res.status(404).json({ error: "Topic not found." });
    }

    return res.json(topic);
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await getUserByUsername(username);

    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = await createSession(user.id);
    return res.json({
      token,
      user: await getSafeUserById(user.id),
    });
  }),
);

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.post(
  "/api/auth/logout",
  authRequired,
  asyncHandler(async (req, res) => {
    await deleteSession(req.token);
    res.status(204).send();
  }),
);

app.get(
  "/api/progress/me",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "student") {
      return res.json({ progress: [] });
    }

    return res.json({ progress: await getStudentProgress(req.user.id) });
  }),
);

app.post(
  "/api/progress/lesson-complete",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only student accounts track lesson progress." });
    }

    const topic = await getTopicById(req.body?.topicId);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found." });
    }

    await upsertLessonProgress(req.user.id, topic.id, { lessonCompleted: true });
    return res.status(204).send();
  }),
);

app.post(
  "/api/quizzes/:topicId/submit",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Quiz submission is only available to student accounts." });
    }

    const topic = await getTopicById(req.params.topicId);
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

    await recordQuizAttempt(req.user.id, topic.id, answers, score, topic.quiz.questions.length);

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
  }),
);

app.get(
  "/api/admin/students",
  adminRequired,
  asyncHandler(async (req, res) => {
    res.json({ students: await getAllStudentProgress() });
  }),
);

app.post(
  "/api/admin/topics",
  adminRequired,
  asyncHandler(async (req, res) => {
    const validationError = validateTopicInput(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      const topic = await saveTopic(req.body, "create");
      return res.status(201).json(topic);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "A topic with that title or slug already exists." });
      }

      throw error;
    }
  }),
);

app.put(
  "/api/admin/topics/:id",
  adminRequired,
  asyncHandler(async (req, res) => {
    const validationError = validateTopicInput(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existing = await getTopicById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Topic not found." });
    }

    try {
      const topic = await saveTopic({ ...req.body, id: existing.id }, "update");
      return res.json(topic);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Another topic already uses that title or slug." });
      }

      throw error;
    }
  }),
);

app.delete(
  "/api/admin/topics/:id",
  adminRequired,
  asyncHandler(async (req, res) => {
    const existing = await getTopicById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Topic not found." });
    }

    await deleteTopic(existing.id);
    res.status(204).send();
  }),
);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong in the API." });
});

const PORT = process.env.PORT || 4000;
const shouldSeedOnBoot =
  process.env.SEED_ON_BOOT === "true" ||
  (!process.env.VERCEL && process.env.NODE_ENV !== "production");
const ready = ensureDatabase({ seed: shouldSeedOnBoot });

async function startServer() {
  await ready;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  ready,
  startServer,
};
