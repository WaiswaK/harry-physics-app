const crypto = require("crypto");
const { Pool } = require("pg");
const { topics: seedTopics, users: seedUsers } = require("./seedData");

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSL === "require"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    }
  : {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      database: process.env.PGDATABASE || "harry_physics_app",
    };

const pool = new Pool(connectionConfig);
const dbFile =
  process.env.DATABASE_URL ||
  `postgres://${connectionConfig.user}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;

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

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

function mapTopicRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    level: row.level,
    duration: row.duration,
    category: row.category,
    summary: row.summary,
    objectives: row.objectives_json,
    lesson: row.lesson_json,
    simulation: row.simulation_json,
    quiz: row.quiz_json,
    updatedAt: row.updated_at,
  };
}

async function seedTopic(topic) {
  const normalized = normalizeTopicInput(topic, topic.id);

  await query(
    `
      INSERT INTO topics (
        id, slug, title, level, duration, category, summary,
        objectives_json, lesson_json, simulation_json, quiz_json, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        level = EXCLUDED.level,
        duration = EXCLUDED.duration,
        category = EXCLUDED.category,
        summary = EXCLUDED.summary,
        objectives_json = EXCLUDED.objectives_json,
        lesson_json = EXCLUDED.lesson_json,
        simulation_json = EXCLUDED.simulation_json,
        quiz_json = EXCLUDED.quiz_json,
        updated_at = EXCLUDED.updated_at;
    `,
    [
      normalized.id,
      normalized.slug,
      normalized.title,
      normalized.level,
      normalized.duration,
      normalized.category,
      normalized.summary,
      JSON.stringify(normalized.objectives),
      JSON.stringify(normalized.lesson),
      JSON.stringify(normalized.simulation),
      JSON.stringify(normalized.quiz),
      normalized.updatedAt,
    ],
  );
}

async function seedUser(user) {
  await query(
    `
      INSERT INTO users (id, name, username, password_hash, role, class_level, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        class_level = EXCLUDED.class_level;
    `,
    [
      user.id,
      user.name,
      user.username,
      hashPassword(user.password),
      user.role,
      user.classLevel,
      now(),
    ],
  );
}

async function ensureDatabase() {
  await query("SELECT 1;");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      class_level TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL UNIQUE,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      objectives_json JSONB NOT NULL,
      lesson_json JSONB NOT NULL,
      simulation_json JSONB NOT NULL,
      quiz_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      lesson_completed BOOLEAN NOT NULL DEFAULT FALSE,
      last_quiz_score INTEGER,
      quiz_attempts INTEGER NOT NULL DEFAULT 0,
      last_activity_at TIMESTAMPTZ NOT NULL,
      UNIQUE(user_id, topic_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      answers_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  for (const topic of seedTopics) {
    await seedTopic(topic);
  }

  for (const user of seedUsers) {
    await seedUser(user);
  }
}

async function getTopicSummaries() {
  return query(
    `
      SELECT
        id,
        slug,
        title,
        level,
        duration,
        category,
        summary,
        jsonb_array_length(quiz_json -> 'questions') AS "quizCount"
      FROM topics
      ORDER BY level, title;
    `,
  );
}

async function getTopicById(id) {
  const rows = await query(
    `
      SELECT *
      FROM topics
      WHERE id = $1 OR slug = $1
      LIMIT 1;
    `,
    [id],
  );

  return rows[0] ? mapTopicRow(rows[0]) : null;
}

async function saveTopic(topic, mode) {
  const normalized = normalizeTopicInput(topic, mode === "update" ? topic.id : undefined);

  if (mode === "create") {
    const rows = await query(
      `
        INSERT INTO topics (
          id, slug, title, level, duration, category, summary,
          objectives_json, lesson_json, simulation_json, quiz_json, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12)
        RETURNING *;
      `,
      [
        normalized.id,
        normalized.slug,
        normalized.title,
        normalized.level,
        normalized.duration,
        normalized.category,
        normalized.summary,
        JSON.stringify(normalized.objectives),
        JSON.stringify(normalized.lesson),
        JSON.stringify(normalized.simulation),
        JSON.stringify(normalized.quiz),
        normalized.updatedAt,
      ],
    );

    return mapTopicRow(rows[0]);
  }

  const rows = await query(
    `
      UPDATE topics
      SET
        slug = $2,
        title = $3,
        level = $4,
        duration = $5,
        category = $6,
        summary = $7,
        objectives_json = $8::jsonb,
        lesson_json = $9::jsonb,
        simulation_json = $10::jsonb,
        quiz_json = $11::jsonb,
        updated_at = $12
      WHERE id = $1
      RETURNING *;
    `,
    [
      topic.id,
      normalized.slug,
      normalized.title,
      normalized.level,
      normalized.duration,
      normalized.category,
      normalized.summary,
      JSON.stringify(normalized.objectives),
      JSON.stringify(normalized.lesson),
      JSON.stringify(normalized.simulation),
      JSON.stringify(normalized.quiz),
      normalized.updatedAt,
    ],
  );

  return rows[0] ? mapTopicRow(rows[0]) : null;
}

async function deleteTopic(id) {
  await query(`DELETE FROM topics WHERE id = $1 OR slug = $1;`, [id]);
}

async function getUserByUsername(username) {
  const rows = await query(
    `
      SELECT id, name, username, password_hash, role, class_level, created_at
      FROM users
      WHERE username = $1
      LIMIT 1;
    `,
    [username],
  );

  return rows[0] || null;
}

async function getSafeUserById(userId) {
  const rows = await query(
    `
      SELECT
        id,
        name,
        username,
        role,
        class_level AS "classLevel",
        created_at AS "createdAt"
      FROM users
      WHERE id = $1
      LIMIT 1;
    `,
    [userId],
  );

  return rows[0] || null;
}

async function createSession(userId) {
  const token = crypto.randomUUID();

  await query(
    `
      INSERT INTO sessions (token, user_id, created_at)
      VALUES ($1, $2, $3);
    `,
    [token, userId, now()],
  );

  return token;
}

async function getUserByToken(token) {
  const rows = await query(
    `
      SELECT
        u.id,
        u.name,
        u.username,
        u.role,
        u.class_level AS "classLevel",
        u.created_at AS "createdAt"
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
      LIMIT 1;
    `,
    [token],
  );

  return rows[0] || null;
}

async function deleteSession(token) {
  await query(`DELETE FROM sessions WHERE token = $1;`, [token]);
}

async function upsertLessonProgress(userId, topicId, changes) {
  const existingRows = await query(
    `
      SELECT id, lesson_completed, last_quiz_score, quiz_attempts
      FROM lesson_progress
      WHERE user_id = $1 AND topic_id = $2
      LIMIT 1;
    `,
    [userId, topicId],
  );

  const existing = existingRows[0];
  const next = {
    id: existing?.id || crypto.randomUUID(),
    lessonCompleted: changes.lessonCompleted ?? existing?.lesson_completed ?? false,
    lastQuizScore: changes.lastQuizScore ?? existing?.last_quiz_score ?? null,
    quizAttempts: changes.incrementAttempts
      ? Number(existing?.quiz_attempts || 0) + 1
      : Number(existing?.quiz_attempts || 0),
    lastActivityAt: now(),
  };

  await query(
    `
      INSERT INTO lesson_progress (
        id, user_id, topic_id, lesson_completed, last_quiz_score, quiz_attempts, last_activity_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, topic_id) DO UPDATE SET
        lesson_completed = EXCLUDED.lesson_completed,
        last_quiz_score = EXCLUDED.last_quiz_score,
        quiz_attempts = EXCLUDED.quiz_attempts,
        last_activity_at = EXCLUDED.last_activity_at;
    `,
    [
      next.id,
      userId,
      topicId,
      next.lessonCompleted,
      next.lastQuizScore,
      next.quizAttempts,
      next.lastActivityAt,
    ],
  );
}

async function recordQuizAttempt(userId, topicId, answers, score, totalQuestions) {
  await query(
    `
      INSERT INTO quiz_attempts (id, user_id, topic_id, score, total_questions, answers_json, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7);
    `,
    [crypto.randomUUID(), userId, topicId, score, totalQuestions, JSON.stringify(answers), now()],
  );

  await upsertLessonProgress(userId, topicId, {
    lastQuizScore: score,
    incrementAttempts: true,
  });
}

async function getStudentProgress(userId) {
  return query(
    `
      SELECT
        t.id AS "topicId",
        t.title AS "topicTitle",
        t.level,
        COALESCE(lp.lesson_completed, FALSE) AS "lessonCompleted",
        lp.last_quiz_score AS "lastQuizScore",
        COALESCE(lp.quiz_attempts, 0) AS "quizAttempts",
        lp.last_activity_at AS "lastActivityAt"
      FROM topics t
      LEFT JOIN lesson_progress lp
        ON lp.topic_id = t.id AND lp.user_id = $1
      ORDER BY t.level, t.title;
    `,
    [userId],
  );
}

async function getAllStudentProgress() {
  return query(
    `
      SELECT
        u.id AS "userId",
        u.name,
        u.username,
        u.class_level AS "classLevel",
        COUNT(*) FILTER (WHERE lp.lesson_completed = TRUE) AS "completedLessons",
        COUNT(*) FILTER (WHERE lp.quiz_attempts > 0) AS "activeQuizTopics",
        MAX(lp.last_activity_at) AS "lastActivityAt"
      FROM users u
      LEFT JOIN lesson_progress lp ON lp.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.username, u.class_level
      ORDER BY u.name;
    `,
  );
}

module.exports = {
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
};
