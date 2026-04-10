import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const simulationControlTemplates = {
  kinematics: [
    {
      id: 'initialVelocity',
      label: 'Initial velocity',
      unit: 'm/s',
      min: 0,
      max: 20,
      step: 1,
      defaultValue: 6,
    },
    {
      id: 'acceleration',
      label: 'Acceleration',
      unit: 'm/s²',
      min: -5,
      max: 10,
      step: 1,
      defaultValue: 2,
    },
    {
      id: 'time',
      label: 'Time',
      unit: 's',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 4,
    },
  ],
  'newton-second-law': [
    {
      id: 'force',
      label: 'Force',
      unit: 'N',
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 24,
    },
    {
      id: 'mass',
      label: 'Mass',
      unit: 'kg',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 6,
    },
    {
      id: 'time',
      label: 'Time',
      unit: 's',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
    },
  ],
  'work-energy': [
    {
      id: 'force',
      label: 'Force',
      unit: 'N',
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 20,
    },
    {
      id: 'distance',
      label: 'Distance',
      unit: 'm',
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 8,
    },
    {
      id: 'mass',
      label: 'Mass',
      unit: 'kg',
      min: 1,
      max: 30,
      step: 1,
      defaultValue: 5,
    },
    {
      id: 'velocity',
      label: 'Velocity',
      unit: 'm/s',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 6,
    },
    {
      id: 'time',
      label: 'Time',
      unit: 's',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 4,
    },
  ],
}

const starterQuizTemplate = [
  {
    id: 1,
    prompt: 'Write the first question prompt here.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 'Option A',
    explanation: 'Explain why this answer is correct.',
  },
  {
    id: 2,
    prompt: 'Write the second question prompt here.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 'Option B',
    explanation: 'Add a short remediation note here.',
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

function buildDefaultSimulationValues(controls = []) {
  return controls.reduce((values, control) => {
    values[control.id] = Number(control.defaultValue ?? control.min ?? 0)
    return values
  }, {})
}

function createEmptyAdminForm() {
  return {
    id: '',
    title: '',
    level: 'Senior 1',
    duration: '10 min',
    category: 'Mechanics',
    summary: '',
    objectivesText: '',
    lessonOverview: '',
    lessonConceptsText: '',
    lessonActivitiesText: '',
    simulationType: 'kinematics',
    simulationTitle: '',
    simulationDescription: '',
    simulationFormulaNote: '',
    simulationControls: JSON.stringify(simulationControlTemplates.kinematics, null, 2),
    quizTitle: '',
    quizQuestions: JSON.stringify(starterQuizTemplate, null, 2),
  }
}

function serializeTopicToForm(topic) {
  return {
    id: topic.id,
    title: topic.title,
    level: topic.level,
    duration: topic.duration,
    category: topic.category,
    summary: topic.summary,
    objectivesText: topic.objectives.join('\n'),
    lessonOverview: topic.lesson.overview,
    lessonConceptsText: topic.lesson.concepts.join('\n'),
    lessonActivitiesText: topic.lesson.activities.join('\n'),
    simulationType: topic.simulation.type,
    simulationTitle: topic.simulation.title,
    simulationDescription: topic.simulation.description,
    simulationFormulaNote: topic.simulation.formulaNote || '',
    simulationControls: JSON.stringify(topic.simulation.controls, null, 2),
    quizTitle: topic.quiz.title,
    quizQuestions: JSON.stringify(topic.quiz.questions, null, 2),
  }
}

function parseMultilineText(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTopicPayload(formState) {
  let parsedControls
  let parsedQuestions

  try {
    parsedControls = JSON.parse(formState.simulationControls)
  } catch {
    throw new Error('Simulation controls must be valid JSON.')
  }

  try {
    parsedQuestions = JSON.parse(formState.quizQuestions)
  } catch {
    throw new Error('Quiz questions must be valid JSON.')
  }

  return {
    title: formState.title,
    level: formState.level,
    duration: formState.duration,
    category: formState.category,
    summary: formState.summary,
    objectives: parseMultilineText(formState.objectivesText),
    lesson: {
      overview: formState.lessonOverview,
      concepts: parseMultilineText(formState.lessonConceptsText),
      activities: parseMultilineText(formState.lessonActivitiesText),
    },
    simulation: {
      type: formState.simulationType,
      title: formState.simulationTitle,
      description: formState.simulationDescription,
      formulaNote: formState.simulationFormulaNote,
      controls: parsedControls,
    },
    quiz: {
      title: formState.quizTitle,
      questions: parsedQuestions,
    },
  }
}

function calculateSimulation(topic, values) {
  if (!topic?.simulation) {
    return []
  }

  switch (topic.simulation.type) {
    case 'kinematics': {
      const initialVelocity = Number(values.initialVelocity || 0)
      const acceleration = Number(values.acceleration || 0)
      const time = Number(values.time || 0)
      const displacement = initialVelocity * time + 0.5 * acceleration * time * time
      const finalVelocity = initialVelocity + acceleration * time

      return [
        { label: 'Displacement', value: `${displacement.toFixed(1)} m`, accent: true },
        { label: 'Final velocity', value: `${finalVelocity.toFixed(1)} m/s` },
      ]
    }

    case 'newton-second-law': {
      const force = Number(values.force || 0)
      const mass = Math.max(Number(values.mass || 1), 1)
      const time = Number(values.time || 0)
      const acceleration = force / mass
      const velocityGain = acceleration * time
      const displacement = 0.5 * acceleration * time * time

      return [
        { label: 'Acceleration', value: `${acceleration.toFixed(2)} m/s²`, accent: true },
        { label: 'Velocity gain', value: `${velocityGain.toFixed(2)} m/s` },
        { label: 'Distance covered', value: `${displacement.toFixed(2)} m` },
      ]
    }

    case 'work-energy': {
      const force = Number(values.force || 0)
      const distance = Number(values.distance || 0)
      const mass = Number(values.mass || 0)
      const velocity = Number(values.velocity || 0)
      const time = Math.max(Number(values.time || 1), 1)
      const work = force * distance
      const kineticEnergy = 0.5 * mass * velocity * velocity
      const power = work / time

      return [
        { label: 'Work done', value: `${work.toFixed(1)} J`, accent: true },
        { label: 'Kinetic energy', value: `${kineticEnergy.toFixed(1)} J` },
        { label: 'Power', value: `${power.toFixed(1)} W` },
      ]
    }

    default:
      return [{ label: 'Simulation type', value: topic.simulation.type, accent: true }]
  }
}

async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed.')
  }

  return payload
}

function App() {
  const [apiMessage, setApiMessage] = useState('Connecting to physics API...')
  const [apiStatus, setApiStatus] = useState('loading')
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [contentStatus, setContentStatus] = useState('Loading topics...')
  const [activeView, setActiveView] = useState('learn')
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [simulationValues, setSimulationValues] = useState({})
  const [adminForm, setAdminForm] = useState(createEmptyAdminForm)
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    async function loadBootData() {
      try {
        const [hello, topicList] = await Promise.all([
          fetchJson('/api/hello'),
          fetchJson('/api/topics'),
        ])

        setApiMessage(hello.message)
        setApiStatus('online')
        setTopics(topicList)
        setContentStatus(`${topicList.length} topics available`)

        if (topicList.length > 0) {
          setSelectedTopicId((current) => current || topicList[0].id)
        }
      } catch (error) {
        setApiStatus('offline')
        setApiMessage('Backend unavailable. Start the Express server on port 4000.')
        setContentStatus(error.message)
      }
    }

    loadBootData()
  }, [])

  useEffect(() => {
    if (!selectedTopicId) {
      return
    }

    async function loadSelectedTopic() {
      try {
        const topic = await fetchJson(`/api/topics/${selectedTopicId}`)
        setSelectedTopic(topic)
        setSelectedAnswers({})
        setSubmitted(false)
        setSimulationValues(buildDefaultSimulationValues(topic.simulation.controls))
      } catch (error) {
        setContentStatus(error.message)
      }
    }

    loadSelectedTopic()
  }, [selectedTopicId])

  const simulationResults = useMemo(
    () => calculateSimulation(selectedTopic, simulationValues),
    [selectedTopic, simulationValues],
  )

  const score = useMemo(() => {
    if (!selectedTopic?.quiz?.questions) {
      return 0
    }

    return selectedTopic.quiz.questions.reduce((total, question) => {
      return total + (selectedAnswers[question.id] === question.answer ? 1 : 0)
    }, 0)
  }, [selectedAnswers, selectedTopic])

  const handleAnswerSelect = (questionId, option) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: option }))
  }

  const handleSimulationChange = (controlId, nextValue) => {
    setSimulationValues((current) => ({
      ...current,
      [controlId]: Number(nextValue),
    }))
  }

  const handleAdminFieldChange = (event) => {
    const { name, value } = event.target
    setAdminForm((current) => ({ ...current, [name]: value }))
  }

  const handleLoadSelectedIntoAdmin = () => {
    if (!selectedTopic) {
      return
    }

    setAdminForm(serializeTopicToForm(selectedTopic))
    setActiveView('admin')
    setAdminMessage(`Loaded ${selectedTopic.title} into the admin editor.`)
    setAdminError('')
  }

  const handleLoadSimulationTemplate = () => {
    const template = simulationControlTemplates[adminForm.simulationType] || []
    setAdminForm((current) => ({
      ...current,
      simulationControls: JSON.stringify(template, null, 2),
    }))
  }

  const refreshTopics = async (focusTopicId) => {
    const topicList = await fetchJson('/api/topics')
    setTopics(topicList)
    setContentStatus(`${topicList.length} topics available`)

    if (focusTopicId) {
      setSelectedTopicId(focusTopicId)
    } else if (topicList.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topicList[0].id)
    } else if (topicList.length === 0) {
      setSelectedTopicId('')
      setSelectedTopic(null)
    }

    return topicList
  }

  const handleAdminTopicPick = async (topicId) => {
    try {
      const topic = await fetchJson(`/api/topics/${topicId}`)
      setAdminForm(serializeTopicToForm(topic))
      setSelectedTopicId(topic.id)
      setSelectedTopic(topic)
      setSimulationValues(buildDefaultSimulationValues(topic.simulation.controls))
      setSelectedAnswers({})
      setSubmitted(false)
      setActiveView('admin')
      setAdminError('')
      setAdminMessage(`Loaded ${topic.title} into the admin editor.`)
    } catch (error) {
      setAdminError(error.message)
      setAdminMessage('')
    }
  }

  const handleAdminSubmit = async (mode) => {
    setAdminError('')
    setAdminMessage('')

    try {
      const payload = buildTopicPayload(adminForm)
      const path = mode === 'create' ? '/api/topics' : `/api/topics/${adminForm.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const savedTopic = await fetchJson(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      await refreshTopics(savedTopic.id)
      setSelectedTopic(savedTopic)
      setSimulationValues(buildDefaultSimulationValues(savedTopic.simulation.controls))
      setSelectedAnswers({})
      setSubmitted(false)
      setAdminForm(serializeTopicToForm(savedTopic))
      setAdminMessage(
        mode === 'create'
          ? `Created ${savedTopic.title} and saved it in the backend store.`
          : `Updated ${savedTopic.title} in the backend store.`,
      )
    } catch (error) {
      setAdminError(error.message)
    }
  }

  const handleDeleteTopic = async () => {
    if (!adminForm.id) {
      return
    }

    setAdminError('')
    setAdminMessage('')

    try {
      await fetchJson(`/api/topics/${adminForm.id}`, {
        method: 'DELETE',
      })

      const nextTopics = await refreshTopics()
      setAdminForm(createEmptyAdminForm())
      setSelectedTopicId(nextTopics[0]?.id || '')
      setAdminMessage('Topic deleted from the backend store.')
    } catch (error) {
      setAdminError(error.message)
    }
  }

  const selectedSummary = topics.find((topic) => topic.id === selectedTopicId)
  const quizCount = selectedTopic?.quiz?.questions?.length || 0

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Harry Physics App</p>
          <h1>API-driven physics lessons with simulation and admin content tools.</h1>
          <p className="hero-text">
            Topics now come from the backend, and each one carries lesson notes,
            a simulation definition, and a quiz package that the frontend can
            render dynamically.
          </p>

          <div className="status-row">
            <span className={`status-pill ${apiStatus}`}>{apiStatus}</span>
            <span className="status-message">{apiMessage}</span>
          </div>

          <div className="stats-grid">
            <StatCard label="Topics in backend" value={`${topics.length}`} />
            <StatCard label="Selected quiz items" value={`${quizCount}`} />
            <StatCard
              label="Selected simulation"
              value={selectedTopic?.simulation?.type || 'Waiting'}
              accent
            />
          </div>
        </div>

        <div className="hero-card">
          <p className="card-kicker">Content status</p>
          <p className="hero-side-note">{contentStatus}</p>

          <div className="view-switcher" role="tablist" aria-label="App sections">
            <button
              type="button"
              className={activeView === 'learn' ? 'view-button active' : 'view-button'}
              onClick={() => setActiveView('learn')}
            >
              Student view
            </button>
            <button
              type="button"
              className={activeView === 'admin' ? 'view-button active' : 'view-button'}
              onClick={() => setActiveView('admin')}
            >
              Admin view
            </button>
          </div>

          <ul className="check-list compact">
            <li>Select topics from the backend syllabus</li>
            <li>Render lessons, simulations, and quizzes per topic</li>
            <li>Create or update new content from the frontend</li>
          </ul>
        </div>
      </section>

      <section className="panel topic-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Topics</p>
            <h2>Choose a syllabus topic</h2>
          </div>
          {selectedSummary ? (
            <div className="topic-badge">
              {selectedSummary.category} • {selectedSummary.level}
            </div>
          ) : null}
        </div>

        <div className="topic-selector" role="tablist" aria-label="Physics topics">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={topic.id === selectedTopicId ? 'topic-chip active' : 'topic-chip'}
              onClick={() => setSelectedTopicId(topic.id)}
            >
              <span>{topic.title}</span>
              <small>
                {topic.level} • {topic.quizCount} quiz items
              </small>
            </button>
          ))}
        </div>
      </section>

      {activeView === 'learn' && selectedTopic ? (
        <>
          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Lesson</p>
                  <h2>{selectedTopic.title}</h2>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLoadSelectedIntoAdmin}
                >
                  Edit in admin
                </button>
              </div>

              <p className="lesson-meta">
                {selectedTopic.level} • {selectedTopic.duration} • {selectedTopic.category}
              </p>
              <p>{selectedTopic.summary}</p>

              <div className="lesson-card">
                <p className="subtle-title">Overview</p>
                <p>{selectedTopic.lesson.overview}</p>

                <div className="objective-block">
                  <p className="subtle-title">Learning objectives</p>
                  <ul className="objective-list">
                    {selectedTopic.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div className="lesson-section-grid">
                  <div>
                    <p className="subtle-title">Core concepts</p>
                    <ul className="objective-list compact-list">
                      {selectedTopic.lesson.concepts.map((concept) => (
                        <li key={concept}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="subtle-title">Suggested activities</p>
                    <ul className="objective-list compact-list">
                      {selectedTopic.lesson.activities.map((activity) => (
                        <li key={activity}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Simulation</p>
                  <h2>{selectedTopic.simulation.title}</h2>
                </div>
              </div>

              <p>{selectedTopic.simulation.description}</p>

              <div className="slider-group">
                {selectedTopic.simulation.controls.map((control) => (
                  <label key={control.id}>
                    {control.label}: <strong>{simulationValues[control.id]} {control.unit}</strong>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={simulationValues[control.id] ?? control.defaultValue}
                      onChange={(event) => handleSimulationChange(control.id, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div
                className={
                  simulationResults.length > 2 ? 'result-grid three-columns' : 'result-grid'
                }
              >
                {simulationResults.map((result) => (
                  <StatCard
                    key={result.label}
                    label={result.label}
                    value={result.value}
                    accent={result.accent}
                  />
                ))}
              </div>

              <p className="formula-note">
                <code>{selectedTopic.simulation.formulaNote}</code>
              </p>
            </article>
          </section>

          <section className="panel quiz-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Adaptive practice</p>
                <h2>{selectedTopic.quiz.title}</h2>
              </div>
              {submitted ? (
                <div className="score-badge">
                  Score: {score}/{quizCount}
                </div>
              ) : null}
            </div>

            <div className="quiz-list">
              {selectedTopic.quiz.questions.map((question) => {
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
              <button type="button" className="primary-button" onClick={() => setSubmitted(true)}>
                Check answers
              </button>
            </div>
          </section>
        </>
      ) : null}

      {activeView === 'admin' ? (
        <section className="panel admin-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Administration</p>
              <h2>Manage syllabus content</h2>
            </div>
            <div className="admin-toolbar">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setAdminForm(createEmptyAdminForm())
                  setAdminError('')
                  setAdminMessage('Ready to create a new topic.')
                }}
              >
                New topic
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleLoadSelectedIntoAdmin}
              >
                Load selected topic
              </button>
            </div>
          </div>

          {adminMessage ? <p className="admin-message success">{adminMessage}</p> : null}
          {adminError ? <p className="admin-message error">{adminError}</p> : null}

          <div className="admin-topic-strip">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={adminForm.id === topic.id ? 'topic-chip active' : 'topic-chip'}
                onClick={() => handleAdminTopicPick(topic.id)}
              >
                <span>{topic.title}</span>
                <small>{topic.level}</small>
              </button>
            ))}
          </div>

          <div className="admin-form-grid">
            <label>
              Topic title
              <input name="title" value={adminForm.title} onChange={handleAdminFieldChange} />
            </label>
            <label>
              Level
              <input name="level" value={adminForm.level} onChange={handleAdminFieldChange} />
            </label>
            <label>
              Duration
              <input name="duration" value={adminForm.duration} onChange={handleAdminFieldChange} />
            </label>
            <label>
              Category
              <input name="category" value={adminForm.category} onChange={handleAdminFieldChange} />
            </label>
            <label className="full-span">
              Summary
              <textarea
                name="summary"
                rows="3"
                value={adminForm.summary}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Objectives, one per line
              <textarea
                name="objectivesText"
                rows="4"
                value={adminForm.objectivesText}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Lesson overview
              <textarea
                name="lessonOverview"
                rows="4"
                value={adminForm.lessonOverview}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label>
              Simulation type
              <select
                name="simulationType"
                value={adminForm.simulationType}
                onChange={handleAdminFieldChange}
              >
                <option value="kinematics">Kinematics</option>
                <option value="newton-second-law">Newton second law</option>
                <option value="work-energy">Work and energy</option>
              </select>
            </label>
            <label>
              Simulation title
              <input
                name="simulationTitle"
                value={adminForm.simulationTitle}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Simulation description
              <textarea
                name="simulationDescription"
                rows="3"
                value={adminForm.simulationDescription}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Formula note
              <input
                name="simulationFormulaNote"
                value={adminForm.simulationFormulaNote}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Lesson concepts, one per line
              <textarea
                name="lessonConceptsText"
                rows="4"
                value={adminForm.lessonConceptsText}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Lesson activities, one per line
              <textarea
                name="lessonActivitiesText"
                rows="4"
                value={adminForm.lessonActivitiesText}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Simulation controls JSON
              <textarea
                name="simulationControls"
                rows="12"
                value={adminForm.simulationControls}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Quiz title
              <input
                name="quizTitle"
                value={adminForm.quizTitle}
                onChange={handleAdminFieldChange}
              />
            </label>
            <label className="full-span">
              Quiz questions JSON
              <textarea
                name="quizQuestions"
                rows="14"
                value={adminForm.quizQuestions}
                onChange={handleAdminFieldChange}
              />
            </label>
          </div>

          <div className="admin-actions">
            <button type="button" className="secondary-button" onClick={handleLoadSimulationTemplate}>
              Load simulation template
            </button>
            <button type="button" className="primary-button" onClick={() => handleAdminSubmit('create')}>
              Save as new topic
            </button>
            <button
              type="button"
              className="primary-button muted-button"
              disabled={!adminForm.id}
              onClick={() => handleAdminSubmit('update')}
            >
              Update topic
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={!adminForm.id}
              onClick={handleDeleteTopic}
            >
              Delete topic
            </button>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
