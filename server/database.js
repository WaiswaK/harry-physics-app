const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { topics: seedTopics, users: seedUsers } = require("./seedData");

const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "harry-physics.db");

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function runSql(sql, options = {}) {
  const args = [];

  if (options.json) {
    args.push("-json");
  }

  args.push(dbFile, sql);
  const output = execFileSync("sqlite3", args, { encoding: "utf8" });
  return options.json ? JSON.parse(output || "[]") : output;
}

function now() {
  return new Date().toISOString();
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
    map[control.id] = Number(control.defaultValue ?? control.min ?? 0);
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
    updatedAt: now(),
  };
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function serializeTopic(topic) {
  return `(
    ${sqlValue(topic.id)},
    ${sqlValue(topic.slug)},
    ${sqlValue(topic.title)},
    ${sqlValue(topic.level)},
    ${sqlValue(topic.duration)},
    ${sqlValue(topic.category)},
    ${sqlValue(topic.summary)},
    ${sqlValue(JSON.stringify(topic.objectives))},
    ${sqlValue(JSON.stringify(topic.lesson))},
    ${sqlValue(JSON.stringify(topic.simulation))},
    ${sqlValue(JSON.stringify(topic.quiz))},
    ${sqlValue(topic.updatedAt || now())}
  )`;
}

function parseTopicRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    level: row.level,
    duration: row.duration,
    category: row.category,
    summary: row.summary,
    objectives: JSON.parse(row.objectives_json),
    lesson: JSON.parse(row.lesson_json),
    simulation: JSON.parse(row.simulation_json),
    quiz: JSON.parse(row.quiz_json),
    updatedAt: row.updated_at,
  };
}

function ensureDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });

  runSql(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      class_level TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL UNIQUE,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      objectives_json TEXT NOT NULL,
      lesson_json TEXT NOT NULL,
      simulation_json TEXT NOT NULL,
      quiz_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      lesson_completed INTEGER NOT NULL DEFAULT 0,
      last_quiz_score INTEGER,
      quiz_attempts INTEGER NOT NULL DEFAULT 0,
      last_activity_at TEXT NOT NULL,
      UNIQUE(user_id, topic_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );
  `);

  const seedTopicValues = seedTopics.map((topic) => serializeTopic(normalizeTopicInput(topic, topic.id))).join(",\n");
  runSql(`
    INSERT OR IGNORE INTO topics (
      id, slug, title, level, duration, category, summary,
      objectives_json, lesson_json, simulation_json, quiz_json, updated_at
    ) VALUES ${seedTopicValues};
  `);

  for (const user of seedUsers) {
    runSql(`
      INSERT OR IGNORE INTO users (id, name, username, password_hash, role, class_level, created_at)
      VALUES (
        ${sqlValue(user.id)},
        ${sqlValue(user.name)},
        ${sqlValue(user.username)},
        ${sqlValue(hashPassword(user.password))},
        ${sqlValue(user.role)},
        ${sqlValue(user.classLevel)},
        ${sqlValue(now())}
      );
    `);
  }
}

function getTopicSummaries() {
  return runSql(
    `
      SELECT
        id,
        slug,
        title,
        level,
        duration,
        category,
        summary,
        json_array_length(quiz_json, '$.questions') AS quizCount
      FROM topics
      ORDER BY level, title;
    `,
    { json: true },
  );
}

function getTopics() {
  return runSql("SELECT * FROM topics ORDER BY level, title;", { json: true }).map(parseTopicRow);
}

function getTopicById(id) {
  const rows = runSql(
    `SELECT * FROM topics WHERE id = ${sqlValue(id)} OR slug = ${sqlValue(id)} LIMIT 1;`,
    { json: true },
  );
  return rows[0] ? parseTopicRow(rows[0]) : null;
}

function saveTopic(topic, mode) {
  const normalized = normalizeTopicInput(topic, mode === "update" ? topic.id : undefined);

  if (mode === "create") {
    runSql(`
      INSERT INTO topics (
        id, slug, title, level, duration, category, summary,
        objectives_json, lesson_json, simulation_json, quiz_json, updated_at
      ) VALUES ${serializeTopic(normalized)};
    `);
    return normalized;
  }

  runSql(`
    UPDATE topics
    SET
      slug = ${sqlValue(normalized.slug)},
      title = ${sqlValue(normalized.title)},
      level = ${sqlValue(normalized.level)},
      duration = ${sqlValue(normalized.duration)},
      category = ${sqlValue(normalized.category)},
      summary = ${sqlValue(normalized.summary)},
      objectives_json = ${sqlValue(JSON.stringify(normalized.objectives))},
      lesson_json = ${sqlValue(JSON.stringify(normalized.lesson))},
      simulation_json = ${sqlValue(JSON.stringify(normalized.simulation))},
      quiz_json = ${sqlValue(JSON.stringify(normalized.quiz))},
      updated_at = ${sqlValue(normalized.updatedAt)}
    WHERE id = ${sqlValue(topic.id)};
  `);

  return normalized;
}

function deleteTopic(id) {
  runSql(`DELETE FROM topics WHERE id = ${sqlValue(id)} OR slug = ${sqlValue(id)};`);
}

function getUserByUsername(username) {
  const rows = runSql(
    `SELECT id, name, username, password_hash, role, class_level, created_at FROM users WHERE username = ${sqlValue(username)} LIMIT 1;`,
    { json: true },
  );
  return rows[0] || null;
}

function getSafeUserById(userId) {
  const rows = runSql(
    `SELECT id, name, username, role, class_level AS classLevel, created_at AS createdAt FROM users WHERE id = ${sqlValue(userId)} LIMIT 1;`,
    { json: true },
  );
  return rows[0] || null;
}

function createSession(userId) {
  const token = crypto.randomUUID();
  runSql(`
    INSERT INTO sessions (token, user_id, created_at)
    VALUES (${sqlValue(token)}, ${sqlValue(userId)}, ${sqlValue(now())});
  `);
  return token;
}

function getUserByToken(token) {
  const rows = runSql(
    `
      SELECT
        u.id,
        u.name,
        u.username,
        u.role,
        u.class_level AS classLevel,
        u.created_at AS createdAt
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${sqlValue(token)}
      LIMIT 1;
    `,
    { json: true },
  );

  return rows[0] || null;
}

function deleteSession(token) {
  runSql(`DELETE FROM sessions WHERE token = ${sqlValue(token)};`);
}

function upsertLessonProgress(userId, topicId, changes) {
  const existingRows = runSql(
    `
      SELECT id, lesson_completed, last_quiz_score, quiz_attempts
      FROM lesson_progress
      WHERE user_id = ${sqlValue(userId)} AND topic_id = ${sqlValue(topicId)}
      LIMIT 1;
    `,
    { json: true },
  );

  const existing = existingRows[0];
  const next = {
    id: existing?.id || crypto.randomUUID(),
    lesson_completed: changes.lessonCompleted ?? existing?.lesson_completed ?? 0,
    last_quiz_score: changes.lastQuizScore ?? existing?.last_quiz_score ?? null,
    quiz_attempts: changes.incrementAttempts
      ? Number(existing?.quiz_attempts || 0) + 1
      : Number(existing?.quiz_attempts || 0),
    last_activity_at: now(),
  };

  runSql(`
    INSERT INTO lesson_progress (
      id, user_id, topic_id, lesson_completed, last_quiz_score, quiz_attempts, last_activity_at
    ) VALUES (
      ${sqlValue(next.id)},
      ${sqlValue(userId)},
      ${sqlValue(topicId)},
      ${sqlValue(next.lesson_completed)},
      ${sqlValue(next.last_quiz_score)},
      ${sqlValue(next.quiz_attempts)},
      ${sqlValue(next.last_activity_at)}
    )
    ON CONFLICT(user_id, topic_id) DO UPDATE SET
      lesson_completed = excluded.lesson_completed,
      last_quiz_score = excluded.last_quiz_score,
      quiz_attempts = excluded.quiz_attempts,
      last_activity_at = excluded.last_activity_at;
  `);
}

function recordQuizAttempt(userId, topicId, answers, score, totalQuestions) {
  runSql(`
    INSERT INTO quiz_attempts (id, user_id, topic_id, score, total_questions, answers_json, created_at)
    VALUES (
      ${sqlValue(crypto.randomUUID())},
      ${sqlValue(userId)},
      ${sqlValue(topicId)},
      ${sqlValue(score)},
      ${sqlValue(totalQuestions)},
      ${sqlValue(JSON.stringify(answers))},
      ${sqlValue(now())}
    );
  `);

  upsertLessonProgress(userId, topicId, {
    lastQuizScore: score,
    incrementAttempts: true,
  });
}

function getStudentProgress(userId) {
  return runSql(
    `
      SELECT
        t.id AS topicId,
        t.title AS topicTitle,
        t.level,
        COALESCE(lp.lesson_completed, 0) AS lessonCompleted,
        lp.last_quiz_score AS lastQuizScore,
        COALESCE(lp.quiz_attempts, 0) AS quizAttempts,
        lp.last_activity_at AS lastActivityAt
      FROM topics t
      LEFT JOIN lesson_progress lp
        ON lp.topic_id = t.id AND lp.user_id = ${sqlValue(userId)}
      ORDER BY t.level, t.title;
    `,
    { json: true },
  );
}

function getAllStudentProgress() {
  return runSql(
    `
      SELECT
        u.id AS userId,
        u.name,
        u.username,
        u.class_level AS classLevel,
        COUNT(CASE WHEN lp.lesson_completed = 1 THEN 1 END) AS completedLessons,
        COUNT(CASE WHEN lp.quiz_attempts > 0 THEN 1 END) AS activeQuizTopics,
        MAX(lp.last_activity_at) AS lastActivityAt
      FROM users u
      LEFT JOIN lesson_progress lp ON lp.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.username, u.class_level
      ORDER BY u.name;
    `,
    { json: true },
  );
}

module.exports = {
  dbFile,
  ensureDatabase,
  getTopicSummaries,
  getTopics,
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
  normalizeTopicInput,
  hashPassword,
};
