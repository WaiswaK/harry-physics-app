import { useEffect, useMemo, useState } from 'react'
import './App.css'

const lessons = [
  {
    id: 'motion',
    title: 'Linear Motion Basics',
    duration: '12 min',
    level: 'Senior 1',
    summary: 'Understand distance, displacement, speed, and velocity with everyday Ugandan examples.',
    objectives: [
      'Differentiate distance from displacement',
      'Relate speed to a distance-time graph',
      'Connect vocabulary to real motion scenarios',
    ],
  },
  {
    id: 'forces',
    title: 'Forces and Free-Body Thinking',
    duration: '15 min',
    level: 'Senior 2',
    summary: 'Use simple force diagrams to explain motion, balance, and acceleration.',
    objectives: [
      'Identify balanced and unbalanced forces',
      'Describe how force affects acceleration',
      'Interpret contact and non-contact forces',
    ],
  },
  {
    id: 'energy',
    title: 'Work, Energy, and Power',
    duration: '14 min',
    level: 'Senior 3',
    summary: 'Link formulas to lifting, pushing, and powering machines in daily life.',
    objectives: [
      'Calculate work done from force and distance',
      'Compare kinetic and potential energy',
      'Explain power as rate of doing work',
    ],
  },
]

const quizQuestions = [
  {
    id: 1,
    prompt: 'A bicycle moves 20 m in 4 s. What is its speed?',
    options: ['4 m/s', '5 m/s', '6 m/s', '24 m/s'],
    answer: '5 m/s',
    explanation: 'Speed = distance / time, so 20 / 4 = 5 m/s.',
  },
  {
    id: 2,
    prompt: 'If acceleration is positive, what happens to velocity over time?',
    options: [
      'It must stay at zero',
      'It decreases only',
      'It changes in the positive direction',
      'It becomes distance',
    ],
    answer: 'It changes in the positive direction',
    explanation: 'Acceleration measures how velocity changes each second.',
  },
]

function StatCard({ label, value, accent }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className={`stat-value ${accent ? 'accent' : ''}`}>{value}</strong>
    </article>
  )
}

function App() {
  const [apiMessage, setApiMessage] = useState('Connecting to physics API...')
  const [apiStatus, setApiStatus] = useState('loading')
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0].id)
  const [velocity, setVelocity] = useState(6)
  const [acceleration, setAcceleration] = useState(2)
  const [time, setTime] = useState(4)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('http://localhost:4000/api/hello')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed')
        }
        return response.json()
      })
      .then((data) => {
        setApiMessage(data.message)
        setApiStatus('online')
      })
      .catch(() => {
        setApiMessage('Backend unavailable. Start the Express server on port 4000.')
        setApiStatus('offline')
      })
  }, [])

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0],
    [selectedLessonId],
  )

  const displacement = useMemo(
    () => velocity * time + 0.5 * acceleration * time * time,
    [velocity, acceleration, time],
  )
  const finalVelocity = useMemo(
    () => velocity + acceleration * time,
    [velocity, acceleration, time],
  )

  const score = useMemo(() => {
    return quizQuestions.reduce((total, question) => {
      return total + (selectedAnswers[question.id] === question.answer ? 1 : 0)
    }, 0)
  }, [selectedAnswers])

  const handleAnswerSelect = (questionId, option) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: option }))
  }

  const handleSubmitQuiz = () => {
    setSubmitted(true)
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Harry Physics App</p>
          <h1>Interactive physics learning built for mobile-first classrooms.</h1>
          <p className="hero-text">
            This prototype brings together lesson reading, experiment-style
            simulation, and instant quiz feedback so students can practice
            concepts instead of only memorizing formulas.
          </p>

          <div className="status-row">
            <span className={`status-pill ${apiStatus}`}>{apiStatus}</span>
            <span className="status-message">{apiMessage}</span>
          </div>

          <div className="stats-grid">
            <StatCard label="Lessons ready" value="3" />
            <StatCard label="Quiz items" value={`${quizQuestions.length}`} />
            <StatCard label="Simulation topic" value="Kinematics" accent />
          </div>
        </div>

        <div className="hero-card">
          <p className="card-kicker">MVP focus</p>
          <ul className="check-list">
            <li>Browse lessons with simple learning goals</li>
            <li>Explore motion using adjustable parameters</li>
            <li>Answer quick questions with remediation</li>
            <li>Prepare the app for auth and analytics next</li>
          </ul>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Lessons</p>
              <h2>Lesson browser</h2>
            </div>
          </div>

          <div className="lesson-tabs" role="tablist" aria-label="Physics lessons">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                className={lesson.id === selectedLessonId ? 'lesson-tab active' : 'lesson-tab'}
                onClick={() => setSelectedLessonId(lesson.id)}
              >
                <span>{lesson.title}</span>
                <small>
                  {lesson.level} • {lesson.duration}
                </small>
              </button>
            ))}
          </div>

          <div className="lesson-card">
            <p className="lesson-meta">
              {selectedLesson.level} • {selectedLesson.duration}
            </p>
            <h3>{selectedLesson.title}</h3>
            <p>{selectedLesson.summary}</p>

            <div className="objective-block">
              <p className="subtle-title">Learning objectives</p>
              <ul className="objective-list">
                {selectedLesson.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Simulation</p>
              <h2>Kinematics sandbox</h2>
            </div>
          </div>

          <div className="slider-group">
            <label>
              Initial velocity: <strong>{velocity} m/s</strong>
              <input
                type="range"
                min="0"
                max="20"
                value={velocity}
                onChange={(event) => setVelocity(Number(event.target.value))}
              />
            </label>
            <label>
              Acceleration: <strong>{acceleration} m/s²</strong>
              <input
                type="range"
                min="-5"
                max="10"
                value={acceleration}
                onChange={(event) => setAcceleration(Number(event.target.value))}
              />
            </label>
            <label>
              Time: <strong>{time} s</strong>
              <input
                type="range"
                min="1"
                max="10"
                value={time}
                onChange={(event) => setTime(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="result-grid">
            <StatCard label="Displacement" value={`${displacement.toFixed(1)} m`} accent />
            <StatCard label="Final velocity" value={`${finalVelocity.toFixed(1)} m/s`} />
          </div>

          <p className="formula-note">
            Using <code>s = ut + 1/2at²</code> and <code>v = u + at</code> for a
            constant-acceleration motion model.
          </p>
        </article>
      </section>

      <section className="panel quiz-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Adaptive practice</p>
            <h2>Quick concept check</h2>
          </div>
          {submitted ? (
            <div className="score-badge">
              Score: {score}/{quizQuestions.length}
            </div>
          ) : null}
        </div>

        <div className="quiz-list">
          {quizQuestions.map((question) => {
            const selected = selectedAnswers[question.id]
            const isCorrect = selected === question.answer

            return (
              <article className="question-card" key={question.id}>
                <p className="question-label">Question {question.id}</p>
                <h3>{question.prompt}</h3>

                <div className="options-grid">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        selected === option ? 'option-button selected' : 'option-button'
                      }
                      onClick={() => handleAnswerSelect(question.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {submitted && selected ? (
                  <p className={isCorrect ? 'feedback correct' : 'feedback incorrect'}>
                    {isCorrect ? 'Correct.' : 'Try again.'} {question.explanation}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>

        <div className="quiz-actions">
          <button type="button" className="primary-button" onClick={handleSubmitQuiz}>
            Check answers
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
