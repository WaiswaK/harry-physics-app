import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const AUTH_STORAGE_KEY = 'harry-physics-auth-token'

const simulationControlTemplates = {
  kinematics: [
    { id: 'initialVelocity', label: 'Initial velocity', unit: 'm/s', min: 0, max: 20, step: 1, defaultValue: 6 },
    { id: 'acceleration', label: 'Acceleration', unit: 'm/s²', min: -5, max: 10, step: 1, defaultValue: 2 },
    { id: 'time', label: 'Time', unit: 's', min: 1, max: 10, step: 1, defaultValue: 4 },
  ],
  'newton-second-law': [
    { id: 'force', label: 'Force', unit: 'N', min: 1, max: 100, step: 1, defaultValue: 24 },
    { id: 'mass', label: 'Mass', unit: 'kg', min: 1, max: 20, step: 1, defaultValue: 6 },
    { id: 'time', label: 'Time', unit: 's', min: 1, max: 10, step: 1, defaultValue: 3 },
  ],
  'work-energy': [
    { id: 'force', label: 'Force', unit: 'N', min: 1, max: 100, step: 1, defaultValue: 20 },
    { id: 'distance', label: 'Distance', unit: 'm', min: 1, max: 50, step: 1, defaultValue: 8 },
    { id: 'mass', label: 'Mass', unit: 'kg', min: 1, max: 30, step: 1, defaultValue: 5 },
    { id: 'velocity', label: 'Velocity', unit: 'm/s', min: 1, max: 20, step: 1, defaultValue: 6 },
    { id: 'time', label: 'Time', unit: 's', min: 1, max: 20, step: 1, defaultValue: 4 },
  ],
  pressure: [
    { id: 'density', label: 'Density', unit: 'kg/m³', min: 500, max: 1500, step: 50, defaultValue: 1000 },
    { id: 'gravity', label: 'Gravity', unit: 'm/s²', min: 8, max: 12, step: 0.5, defaultValue: 10 },
    { id: 'depth', label: 'Depth', unit: 'm', min: 1, max: 20, step: 1, defaultValue: 5 },
  ],
  circuits: [
    { id: 'voltage', label: 'Voltage', unit: 'V', min: 1, max: 24, step: 1, defaultValue: 12 },
    { id: 'resistance', label: 'Resistance', unit: 'ohms', min: 1, max: 20, step: 1, defaultValue: 6 },
  ],
  waves: [
    { id: 'frequency', label: 'Frequency', unit: 'Hz', min: 1, max: 20, step: 1, defaultValue: 5 },
    { id: 'wavelength', label: 'Wavelength', unit: 'm', min: 1, max: 12, step: 1, defaultValue: 4 },
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

function StatCard({ label, value, accent = false }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className={accent ? 'stat-value accent' : 'stat-value'}>{value}</strong>
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

    case 'pressure': {
      const density = Number(values.density || 0)
      const gravity = Number(values.gravity || 0)
      const depth = Number(values.depth || 0)
      const pressure = density * gravity * depth
      return [
        { label: 'Pressure', value: `${pressure.toFixed(0)} Pa`, accent: true },
        { label: 'Depth', value: `${depth.toFixed(1)} m` },
      ]
    }

    case 'circuits': {
      const voltage = Number(values.voltage || 0)
      const resistance = Math.max(Number(values.resistance || 1), 1)
      const current = voltage / resistance
      const power = voltage * current
      return [
        { label: 'Current', value: `${current.toFixed(2)} A`, accent: true },
        { label: 'Power', value: `${power.toFixed(2)} W` },
      ]
    }

    case 'waves': {
      const frequency = Number(values.frequency || 0)
      const wavelength = Number(values.wavelength || 0)
      const speed = frequency * wavelength
      const period = frequency > 0 ? 1 / frequency : 0
      return [
        { label: 'Wave speed', value: `${speed.toFixed(2)} m/s`, accent: true },
        { label: 'Period', value: `${period.toFixed(2)} s` },
      ]
    }

    default:
      return [{ label: 'Simulation type', value: topic.simulation.type, accent: true }]
  }
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(payload?.error || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload
}

function authHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

function App() {
  const [apiMessage, setApiMessage] = useState('Connecting to physics API...')
  const [apiStatus, setApiStatus] = useState('loading')
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [contentStatus, setContentStatus] = useState('Loading topics...')
  const [portalView, setPortalView] = useState('learn')
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [simulationValues, setSimulationValues] = useState({})
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [studentProgress, setStudentProgress] = useState([])
  const [studentDirectory, setStudentDirectory] = useState([])
  const [progressMessage, setProgressMessage] = useState('')
  const [adminForm, setAdminForm] = useState(createEmptyAdminForm)
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')

  const isStudent = currentUser?.role === 'student'
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    async function loadBootData() {
      try {
        const [hello, topicList] = await Promise.all([fetchJson('/api/hello'), fetchJson('/api/topics')])
        setApiMessage(hello.message)
        setApiStatus('online')
        setTopics(topicList)
        setContentStatus(`${topicList.length} topics available in the database`)

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
        setQuizResult(null)
        setSimulationValues(buildDefaultSimulationValues(topic.simulation.controls))
      } catch (error) {
        setContentStatus(error.message)
      }
    }

    loadSelectedTopic()
  }, [selectedTopicId])

  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null)
      setStudentProgress([])
      setStudentDirectory([])
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (portalView !== 'learn') {
        setPortalView('learn')
      }
      return
    }

    localStorage.setItem(AUTH_STORAGE_KEY, authToken)

    async function loadSessionData() {
      try {
        const { user } = await fetchJson('/api/auth/me', {
          headers: authHeaders(authToken),
        })

        setCurrentUser(user)
        setLoginError('')

        if (user.role === 'student') {
          const { progress } = await fetchJson('/api/progress/me', {
            headers: authHeaders(authToken),
          })
          setStudentProgress(progress)
          setStudentDirectory([])
          if (portalView === 'admin') {
            setPortalView('learn')
          }
        }

        if (user.role === 'admin') {
          const { students } = await fetchJson('/api/admin/students', {
            headers: authHeaders(authToken),
          })
          setStudentDirectory(students)
          setStudentProgress([])
        }
      } catch (error) {
        setAuthToken('')
        setCurrentUser(null)
        setLoginError(error.message)
      }
    }

    loadSessionData()
  }, [authToken, portalView])

  const simulationResults = useMemo(
    () => calculateSimulation(selectedTopic, simulationValues),
    [selectedTopic, simulationValues],
  )

  const quizCount = selectedTopic?.quiz?.questions?.length || 0
  const selectedSummary = topics.find((topic) => topic.id === selectedTopicId)
  const currentProgress = studentProgress.find((item) => item.topicId === selectedTopicId)

  const seededAccounts = [
    'Admin: admin / admin123',
    'Student: aisha / student123',
    'Student: brian / student123',
    'Student: claire / student123',
  ]

  async function refreshTopics(focusTopicId) {
    const topicList = await fetchJson('/api/topics')
    setTopics(topicList)
    setContentStatus(`${topicList.length} topics available in the database`)

    if (focusTopicId) {
      setSelectedTopicId(focusTopicId)
      return
    }

    if (!selectedTopicId && topicList[0]) {
      setSelectedTopicId(topicList[0].id)
    }
  }

  async function refreshRoleData(token = authToken, role = currentUser?.role) {
    if (!token || !role) {
      return
    }

    if (role === 'student') {
      const { progress } = await fetchJson('/api/progress/me', {
        headers: authHeaders(token),
      })
      setStudentProgress(progress)
    }

    if (role === 'admin') {
      const { students } = await fetchJson('/api/admin/students', {
        headers: authHeaders(token),
      })
      setStudentDirectory(students)
    }
  }

  const handleSimulationChange = (controlId, nextValue) => {
    setSimulationValues((current) => ({
      ...current,
      [controlId]: Number(nextValue),
    }))
  }

  const handleAnswerSelect = (questionId, option) => {
    if (!isStudent) {
      return
    }

    setSelectedAnswers((current) => ({ ...current, [questionId]: option }))
    setQuizResult(null)
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoginError('')
    setLoginMessage('')

    try {
      const payload = await fetchJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      setAuthToken(payload.token)
      setCurrentUser(payload.user)
      setLoginForm({ username: '', password: '' })
      setLoginMessage(`Logged in as ${payload.user.name}.`)
      setPortalView(payload.user.role === 'admin' ? 'admin' : 'learn')
    } catch (error) {
      setLoginError(error.message)
    }
  }

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetchJson('/api/auth/logout', {
          method: 'POST',
          headers: authHeaders(authToken),
        })
      }
    } catch {
      // Ignore logout cleanup failures and clear local state.
    }

    setAuthToken('')
    setCurrentUser(null)
    setLoginMessage('Logged out.')
    setSelectedAnswers({})
    setQuizResult(null)
    setStudentProgress([])
    setStudentDirectory([])
  }

  const handleMarkLessonComplete = async () => {
    if (!isStudent || !selectedTopic) {
      return
    }

    try {
      await fetchJson('/api/progress/lesson-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(authToken),
        },
        body: JSON.stringify({ topicId: selectedTopic.id }),
      })

      await refreshRoleData(authToken, 'student')
      setProgressMessage(`Saved lesson progress for ${selectedTopic.title}.`)
    } catch (error) {
      setProgressMessage(error.message)
    }
  }

  const handleQuizSubmit = async () => {
    if (!isStudent || !selectedTopic) {
      return
    }

    try {
      const result = await fetchJson(`/api/quizzes/${selectedTopic.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(authToken),
        },
        body: JSON.stringify({ answers: selectedAnswers }),
      })

      setQuizResult(result)
      await refreshRoleData(authToken, 'student')
      setProgressMessage(`Recorded quiz attempt for ${selectedTopic.title}.`)
    } catch (error) {
      setProgressMessage(error.message)
    }
  }

  const handleAdminFieldChange = (event) => {
    const { name, value } = event.target
    setAdminForm((current) => ({ ...current, [name]: value }))
  }

  const handleLoadSelectedIntoAdmin = () => {
    if (!selectedTopic || !isAdmin) {
      return
    }

    setAdminForm(serializeTopicToForm(selectedTopic))
    setPortalView('admin')
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

  const handleAdminTopicPick = async (topicId) => {
    try {
      const topic = await fetchJson(`/api/topics/${topicId}`)
      setAdminForm(serializeTopicToForm(topic))
      setSelectedTopicId(topic.id)
      setSelectedTopic(topic)
      setSimulationValues(buildDefaultSimulationValues(topic.simulation.controls))
      setAdminMessage(`Loaded ${topic.title} into the admin editor.`)
      setAdminError('')
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
      const path = mode === 'create' ? '/api/admin/topics' : `/api/admin/topics/${adminForm.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const savedTopic = await fetchJson(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(authToken),
        },
        body: JSON.stringify(payload),
      })

      await refreshTopics(savedTopic.id)
      setSelectedTopic(savedTopic)
      setSimulationValues(buildDefaultSimulationValues(savedTopic.simulation.controls))
      setAdminForm(serializeTopicToForm(savedTopic))
      setAdminMessage(mode === 'create' ? `Created ${savedTopic.title}.` : `Updated ${savedTopic.title}.`)
      await refreshRoleData(authToken, 'admin')
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
      await fetchJson(`/api/admin/topics/${adminForm.id}`, {
        method: 'DELETE',
        headers: authHeaders(authToken),
      })

      setAdminForm(createEmptyAdminForm())
      await refreshTopics()
      setAdminMessage('Topic deleted from the database.')
      await refreshRoleData(authToken, 'admin')
    } catch (error) {
      setAdminError(error.message)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Harry Physics App</p>
          <h1>Physics lessons are public. Quizzes and progress stay with logged-in students.</h1>
          <p className="hero-text">
            Content now comes from the backend database, with seeded topics, student accounts,
            progress tracking, and an administrator-only content portal.
          </p>

          <div className="status-row">
            <span className={`status-pill ${apiStatus}`}>{apiStatus}</span>
            <span className="status-message">{apiMessage}</span>
          </div>

          <div className="stats-grid">
            <StatCard label="Topics in database" value={`${topics.length}`} />
            <StatCard label="Selected quiz items" value={`${quizCount}`} />
            <StatCard label="Portal access" value={isAdmin ? 'Admin' : isStudent ? 'Student' : 'Guest'} accent />
          </div>
        </div>

        <div className="hero-card">
          <p className="card-kicker">Access</p>
          <p className="hero-side-note">{contentStatus}</p>

          <div className="view-switcher" role="tablist" aria-label="App sections">
            <button
              type="button"
              className={portalView === 'learn' ? 'view-button active' : 'view-button'}
              onClick={() => setPortalView('learn')}
            >
              Lessons
            </button>
            {isAdmin ? (
              <button
                type="button"
                className={portalView === 'admin' ? 'view-button active' : 'view-button'}
                onClick={() => setPortalView('admin')}
              >
                Admin portal
              </button>
            ) : null}
          </div>

          <div className="auth-card">
            <div className="auth-summary">
              <strong>{currentUser ? `${currentUser.name} (${currentUser.role})` : 'Guest access enabled'}</strong>
              <span>
                {currentUser
                  ? isAdmin
                    ? 'Administrator tools are unlocked.'
                    : 'Lessons, quizzes, and progress are available.'
                  : 'Guests can study lessons and simulations without logging in.'}
              </span>
            </div>

            {!currentUser ? (
              <form className="login-form" onSubmit={handleLoginSubmit}>
                <input
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, username: event.target.value }))
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <button type="submit" className="primary-button">
                  Log in
                </button>
              </form>
            ) : (
              <div className="auth-actions">
                <button type="button" className="secondary-button" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}

            {loginMessage ? <p className="info-banner success">{loginMessage}</p> : null}
            {loginError ? <p className="info-banner error">{loginError}</p> : null}

            <div className="seeded-box">
              <p className="subtle-title">Seeded accounts</p>
              <ul className="check-list compact">
                {seededAccounts.map((account) => (
                  <li key={account}>{account}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="panel topic-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Topics</p>
            <h2>Choose a syllabus topic</h2>
          </div>
          {selectedSummary ? <div className="topic-badge">{selectedSummary.category} • {selectedSummary.level}</div> : null}
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

      {portalView === 'learn' && selectedTopic ? (
        <>
          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Lesson</p>
                  <h2>{selectedTopic.title}</h2>
                </div>
                {isAdmin ? (
                  <button type="button" className="secondary-button" onClick={handleLoadSelectedIntoAdmin}>
                    Edit in admin
                  </button>
                ) : null}
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

              {isStudent ? (
                <div className="lesson-actions">
                  <button type="button" className="primary-button" onClick={handleMarkLessonComplete}>
                    Mark lesson complete
                  </button>
                  <span className="helper-text">
                    {currentProgress?.lessonCompleted ? 'Saved as completed.' : 'Completion is saved to your progress.'}
                  </span>
                </div>
              ) : null}
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

              <div className={simulationResults.length > 2 ? 'result-grid three-columns' : 'result-grid'}>
                {simulationResults.map((result) => (
                  <StatCard key={result.label} label={result.label} value={result.value} accent={result.accent} />
                ))}
              </div>

              <p className="formula-note">
                <code>{selectedTopic.simulation.formulaNote}</code>
              </p>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Quiz access</p>
                  <h2>{selectedTopic.quiz.title}</h2>
                </div>
                {quizResult ? <div className="score-badge">Score: {quizResult.score}/{quizResult.total}</div> : null}
              </div>

              {!isStudent ? (
                <div className="locked-panel">
                  <h3>Log in with a student account to attempt quizzes.</h3>
                  <p>
                    Lessons and simulations stay open to everyone, but quiz attempts are saved only for logged-in students.
                  </p>
                </div>
              ) : (
                <>
                  <div className="quiz-list">
                    {selectedTopic.quiz.questions.map((question) => {
                      const selected = selectedAnswers[question.id]
                      const feedback = quizResult?.feedback?.find((item) => item.questionId === question.id)

                      return (
                        <article className="question-card" key={question.id}>
                          <p className="question-label">Question {question.id}</p>
                          <h3>{question.prompt}</h3>

                          <div className="options-grid">
                            {question.options.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className={selected === option ? 'option-button selected' : 'option-button'}
                                onClick={() => handleAnswerSelect(question.id, option)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>

                          {feedback ? (
                            <p className={feedback.isCorrect ? 'feedback correct' : 'feedback incorrect'}>
                              {feedback.isCorrect ? 'Correct.' : `Correct answer: ${feedback.correctAnswer}.`} {feedback.explanation}
                            </p>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>

                  <div className="quiz-actions">
                    <button type="button" className="primary-button" onClick={handleQuizSubmit}>
                      Submit quiz
                    </button>
                    <span className="helper-text">
                      Latest score: {currentProgress?.lastQuizScore ?? 'No attempt yet'} | Attempts: {currentProgress?.quizAttempts ?? 0}
                    </span>
                  </div>
                </>
              )}

              {progressMessage ? <p className="info-banner success">{progressMessage}</p> : null}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Progress</p>
                  <h2>{isStudent ? 'Your learning progress' : 'Progress becomes available after login'}</h2>
                </div>
              </div>

              {isStudent ? (
                <div className="progress-grid">
                  <StatCard
                    label="Completed lessons"
                    value={`${studentProgress.filter((item) => item.lessonCompleted).length}/${topics.length}`}
                    accent
                  />
                  <StatCard
                    label="Quiz topics attempted"
                    value={`${studentProgress.filter((item) => item.quizAttempts > 0).length}`}
                  />
                  <StatCard
                    label="Current topic score"
                    value={currentProgress?.lastQuizScore ?? 'Pending'}
                  />
                </div>
              ) : (
                <div className="locked-panel">
                  <h3>Students can save progress across topics.</h3>
                  <p>Guest learners can still read every lesson and use every simulation without signing in.</p>
                </div>
              )}

              {isStudent ? (
                <div className="progress-list">
                  {studentProgress.map((item) => (
                    <article key={item.topicId} className="progress-row">
                      <div>
                        <strong>{item.topicTitle}</strong>
                        <small>{item.level}</small>
                      </div>
                      <div>
                        <span>{item.lessonCompleted ? 'Lesson complete' : 'Lesson pending'}</span>
                        <small>Quiz: {item.lastQuizScore ?? 'No score yet'} | Attempts: {item.quizAttempts}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </article>
          </section>
        </>
      ) : null}

      {portalView === 'admin' && isAdmin ? (
        <>
          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Students</p>
                  <h2>Monitor student activity</h2>
                </div>
              </div>

              <div className="progress-list">
                {studentDirectory.map((student) => (
                  <article className="progress-row" key={student.userId}>
                    <div>
                      <strong>{student.name}</strong>
                      <small>{student.username} • {student.classLevel}</small>
                    </div>
                    <div>
                      <span>{student.completedLessons} lessons complete</span>
                      <small>
                        Quiz topics: {student.activeQuizTopics} | Last active: {student.lastActivityAt || 'No activity yet'}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Database</p>
                  <h2>Admin controls</h2>
                </div>
              </div>

              <ul className="check-list compact">
                <li>Students cannot see this portal unless they log in as an administrator.</li>
                <li>Topic create, update, and delete requests go through admin-only backend routes.</li>
                <li>Lessons stay public while quiz attempts remain tied to student accounts.</li>
              </ul>
            </article>
          </section>

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
                <button type="button" className="secondary-button" onClick={handleLoadSelectedIntoAdmin}>
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
                <textarea name="summary" rows="3" value={adminForm.summary} onChange={handleAdminFieldChange} />
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
                <select name="simulationType" value={adminForm.simulationType} onChange={handleAdminFieldChange}>
                  <option value="kinematics">Kinematics</option>
                  <option value="newton-second-law">Newton second law</option>
                  <option value="work-energy">Work and energy</option>
                  <option value="pressure">Pressure</option>
                  <option value="circuits">Circuits</option>
                  <option value="waves">Waves</option>
                </select>
              </label>
              <label>
                Simulation title
                <input name="simulationTitle" value={adminForm.simulationTitle} onChange={handleAdminFieldChange} />
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
                <input name="quizTitle" value={adminForm.quizTitle} onChange={handleAdminFieldChange} />
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
              <button type="button" className="danger-button" disabled={!adminForm.id} onClick={handleDeleteTopic}>
                Delete topic
              </button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}

export default App
