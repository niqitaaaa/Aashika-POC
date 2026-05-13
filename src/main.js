import './style.css'

const rolesSeed = [
  ['CHRO', 'Human Resources'],
  ['CFO', 'Finance'],
  ['CCO', 'Commercial & Procurement'],
  ['CEO – Metal', 'Metal Operations'],
  ['CEO – Power & Barra', 'Power Generation & Barra Operations'],
  ['Dy. CEO – Rolled Products', 'Rolled Products Business'],
  ['Head CSR', 'Corporate Social Responsibility'],
  ['Head Legal', 'Legal & Compliance'],
  ['Head PR & Corp. Comm.', 'Public Relations & Communications'],
  ['Chief HSE & Sustainability', 'Health, Safety, Environment & Sustainability'],
  ['CDO', 'Digital Transformation'],
  ['CSO', 'Security'],
  ['Chief Corp. Affairs & Admin', 'Corporate Affairs & Administration'],
  ['Head Quality & Process Control', 'Quality Management'],
  ['Head BE, AO, Reliability & Innovation', 'Business Excellence & Innovation'],
  ['Head Corp. Affairs, Raipur', 'Corporate Affairs (Raipur)'],
]

const vedantaCompetencies = [
  'Stretches & Drives',
  'Business Acumen',
  'External/Internal Environment',
  'Develops People',
  'Thinks Strategically',
  'Leads Change',
]

const tagTargets = {
  STR: 4.8,
  OPS: 4.5,
  BUS: 4.6,
  LEAD: 4.7,
  TRANS: 4.4,
}

const navItems = [
  'Executive Dashboard',
  'Critical Role Explorer',
  'Successor Profile',
  'Eligible Candidate Layer',
  'Tag Development System',
  'Risk Intelligence Centre',
  'Scenario Planning',
  'Analytics Hub',
  'Development Engine',
  'Frameworks & Settings',
]

const round = (value) => Number(value.toFixed(2))
const avg = (values) => {
  const valid = values.filter((v) => Number.isFinite(v))
  return valid.length ? round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
}
const pseudo = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const readinessCategory = (gap) => {
  if (gap <= 0.3) return 'Immediate'
  if (gap <= 0.8) return 'Short-Term'
  if (gap <= 1.5) return 'Medium-Term'
  return 'Needs Development'
}

const timeToReady = (gap) => (gap <= 0.3 ? 0 : gap <= 0.8 ? 6 : gap <= 1.5 ? 18 : 36)
const readinessPercent = (gap) => round((1 - gap / 5) * 100)
const riskTier = (risk) => (risk >= 0.7 ? 'High' : risk >= 0.5 ? 'Medium' : 'Low')
const TIMELINE_MONTH_MAX = 60
const SCENARIO_CUSTOM_BONUS = 0.3
const SCENARIO_DEFAULT_BONUS = 0.15
const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const buildSkills = (roleIndex, successorIndex) => {
  const tags = Object.keys(tagTargets)
  const skills = []
  tags.forEach((tag, tagIndex) => {
    for (let i = 0; i < 3; i += 1) {
      const seed = roleIndex * 101 + successorIndex * 37 + tagIndex * 11 + i * 5
      const base = 2.6 + pseudo(seed) * 2.2
      const E = round(Math.max(1, Math.min(5, base + 0.15)))
      const D = round(Math.max(1, Math.min(5, base - 0.1)))
      const I = round(Math.max(1, Math.min(5, base + 0.05)))
      const final = round((E + D + I) / 3)
      skills.push({
        skill: `${tag} Skill ${i + 1}`,
        tag,
        E,
        D,
        I,
        final,
        type: i === 2 ? 'Behavioural' : 'Functional',
      })
    }
  })
  return skills
}

const buildSuccessor = (role, roleIndex, successorIndex) => {
  const skills = buildSkills(roleIndex, successorIndex)
  const competencyScores = Object.fromEntries(
    vedantaCompetencies.map((name, idx) => {
      const seed = roleIndex * 61 + successorIndex * 23 + idx * 7
      const score = round(Math.max(1, Math.min(5, 2.8 + pseudo(seed) * 2)))
      return [name, score]
    }),
  )

  const tagAverages = Object.fromEntries(
    Object.keys(tagTargets).map((tag) => [tag, avg(skills.filter((s) => s.tag === tag).map((s) => s.final))]),
  )

  const tagGaps = Object.fromEntries(Object.keys(tagTargets).map((tag) => [tag, round(tagTargets[tag] - tagAverages[tag])]))
  const vedantaGaps = vedantaCompetencies.map((k) => round(4.6 - competencyScores[k]))
  const overallGap = avg([
    avg(vedantaGaps),
    avg(skills.filter((s) => s.type === 'Functional').map((s) => tagTargets[s.tag] - s.final)),
    avg(skills.filter((s) => s.type === 'Behavioural').map((s) => tagTargets[s.tag] - s.final)),
  ])

  const strengths = Object.entries(tagGaps)
    .filter(([, gap]) => gap <= 0.3)
    .map(([tag]) => `${tag} capability`)
  const developmentAreas = Object.entries(tagGaps)
    .filter(([, gap]) => gap > 0.3 && gap <= 1.5)
    .map(([tag]) => `${tag} uplift`)
  const criticalGaps = Object.entries(tagGaps)
    .filter(([, gap]) => gap > 1.5)
    .map(([tag]) => `${tag} critical closure`)

  return {
    id: `${role.id}-s${successorIndex}`,
    label: `Successor ${successorIndex}`,
    competencyScores,
    tagAverages,
    tagGaps,
    overallGap,
    category: readinessCategory(overallGap),
    readinessPct: readinessPercent(overallGap),
    monthsToReady: timeToReady(overallGap),
    strengths,
    developmentAreas,
    criticalGaps,
    skills,
  }
}

const roles = rolesSeed.map(([title, functionArea], idx) => {
  const role = {
    id: `role-${idx + 1}`,
    title,
    functionArea,
    strategicImportance: round(0.65 + pseudo((idx + 1) * 17) * 0.35),
    roleTagTargets: { ...tagTargets },
  }

  role.successors = [1, 2, 3].map((n) => buildSuccessor(role, idx + 1, n))
  role.bestGap = round(Math.min(...role.successors.map((s) => s.overallGap)))
  role.bestReadinessPct = readinessPercent(role.bestGap)
  role.timeToReady = timeToReady(role.bestGap)
  role.benchStrengthRole = round(role.successors.filter((s) => s.overallGap <= 0.8).length / 3)
  role.hasImmediateReplacement = role.successors.some((s) => s.overallGap <= 0.3)
  role.riskScore = round(
    (1 - role.bestReadinessPct / 100) * role.strategicImportance * (role.timeToReady >= 36 ? 1 : role.timeToReady >= 18 ? 0.8 : 0.6),
  )
  role.riskTier = riskTier(role.riskScore)
  role.readinessCategory = readinessCategory(role.bestGap)
  return role
})

const roleById = Object.fromEntries(roles.map((r) => [r.id, r]))
const functions = [...new Set(roles.map((r) => r.functionArea))]

const state = {
  page: 'Executive Dashboard',
  selectedFunctions: [...functions],
  roleId: roles[0]?.id,
  successorId: roles[0]?.successors[0]?.id,
  timelineMonths: 24,
  scenarioType: 'Single Role Transition',
}

const selectedRole = () => roleById[state.roleId] ?? roles[0]

const filteredRoles = () => {
  if (state.selectedFunctions.length === 0 || state.selectedFunctions.length === functions.length) return roles
  return roles.filter((r) => state.selectedFunctions.includes(r.functionArea))
}

const allSuccessors = () => filteredRoles().flatMap((r) => r.successors)

const kpiData = () => {
  const roleSet = filteredRoles()
  const successors = allSuccessors()
  const immediate = successors.filter((s) => s.overallGap <= 0.3).length
  const highRisk = roleSet.filter((r) => !r.successors.some((s) => s.overallGap <= 0.8)).length
  const benchStrength = successors.length ? round(successors.filter((s) => s.overallGap <= 0.8).length / successors.length) : 0
  const criticalGaps = successors.reduce((sum, s) => sum + Object.values(s.tagGaps).filter((gap) => gap > 1.5).length, 0)
  const pipeline = successors.filter((s) => s.category === 'Medium-Term').length
  const sri = round(1 - avg(successors.map((s) => s.overallGap)) / 5)
  const avgTtr = round(avg(successors.filter((s) => s.overallGap > 0.3).map((s) => s.monthsToReady)))
  const transGap = round(avg(successors.map((s) => s.tagGaps.TRANS)))

  return [
    {
      label: 'Succession Readiness Index',
      value: sri,
      trend: '+2.1%',
      definition: 'Single-number health indicator of the leadership pipeline.',
      calculation: '1 − (Average all overall gaps / 5)',
      why: 'Tracks whether org readiness is strengthening or weakening.',
    },
    {
      label: 'Immediate Successors',
      value: immediate,
      trend: '+1',
      definition: 'Successors ready with minimal disruption.',
      calculation: 'Count(gap ≤ 0.3)',
      why: 'Direct indicator of immediate continuity coverage.',
    },
    {
      label: 'High Risk Roles',
      value: highRisk,
      trend: '-1',
      definition: 'Roles without Immediate/Short-Term successor.',
      calculation: 'Count(roles with no successor gap ≤ 0.8)',
      why: 'Defines top intervention watchlist.',
    },
    {
      label: 'Bench Strength Score',
      value: benchStrength,
      trend: '+3%',
      definition: 'Coverage of succession seats by development-ready successors.',
      calculation: 'Count(gap ≤ 0.8) / total succession seats',
      why: 'Core continuity depth benchmark.',
    },
    {
      label: 'Critical Gaps',
      value: criticalGaps,
      trend: '-4',
      definition: 'Severe tag-level capability gaps in portfolio.',
      calculation: 'Count(tag avg gaps > 1.5)',
      why: 'Highlights systemic weakness concentrations.',
    },
    {
      label: 'Development Pipeline',
      value: pipeline,
      trend: '+5',
      definition: 'Successors currently in Medium-Term readiness.',
      calculation: 'Count(successors at Medium-Term readiness)',
      why: 'Future bench depth in 12–24 month horizon.',
    },
    {
      label: 'Avg Time-to-Ready',
      value: `${avgTtr} mo`,
      trend: '-2 mo',
      definition: 'Average time required to close non-immediate gaps.',
      calculation: 'Average(Time-to-Ready where gap > 0.3)',
      why: 'Monitors development velocity across the portfolio.',
    },
    {
      label: 'TRANS Tag Gap',
      value: transGap,
      trend: '-0.08',
      definition: 'Organization-wide transformation capability gap.',
      calculation: 'Average TRANS gap across all successors',
      why: 'Signals digital/transformation readiness.',
    },
  ]
}

const roleHeatmap = (rows) => `
  <div class="table-wrap">
    <table class="table compact heatmap">
      <thead><tr><th>Role</th><th>S1</th><th>S2</th><th>S3</th><th>Best Gap</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (role) => `<tr>
            <td>${esc(role.title)}</td>
            ${role.successors
              .map(
                (s) => `<td class="heat ${s.category.toLowerCase().replace(/\s+/g, '-')}">
                  <button class="cell-btn" data-role="${esc(role.id)}" data-successor="${esc(s.id)}" title="${esc(s.label)}: gap ${esc(s.overallGap)} (${esc(s.category)})">${esc(s.overallGap)}</button>
                </td>`,
              )
              .join('')}
            <td>${role.bestGap}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
`

const radarSvg = (tagGapMap) => {
  const tags = Object.keys(tagTargets)
  const points = tags
    .map((tag, idx) => {
      const angle = ((Math.PI * 2) / tags.length) * idx - Math.PI / 2
      const radius = Math.max(8, 70 - Number(tagGapMap[tag] || 0) * 16)
      const x = round(90 + radius * Math.cos(angle))
      const y = round(90 + radius * Math.sin(angle))
      return { tag, x, y }
    })

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')
  const labels = points
    .map((p) => `<text x="${p.x}" y="${p.y - 8}" font-size="9" text-anchor="middle">${p.tag}</text>`)
    .join('')

  return `
    <svg viewBox="0 0 180 180" class="radar">
      <circle cx="90" cy="90" r="70" class="radar-ring" />
      <circle cx="90" cy="90" r="48" class="radar-ring" />
      <circle cx="90" cy="90" r="24" class="radar-ring" />
      <polygon points="${polygon}" class="radar-shape" />
      ${labels}
    </svg>
  `
}

const criticalAlerts = () => {
  const roleSet = filteredRoles()
  const highRiskRoles = roleSet.filter((r) => !r.successors.some((s) => s.overallGap <= 0.8))
  const degraded = roleSet.filter((r) => r.bestGap > 1)
  const milestones = roleSet.filter((r) => r.timeToReady > 0 && r.timeToReady <= 18)

  return [
    ...highRiskRoles.slice(0, 4).map((r) => ({ tone: 'bad', text: `${r.title}: no ready successor` })),
    ...degraded.slice(0, 4).map((r) => ({ tone: 'warn', text: `${r.title}: degraded readiness trend` })),
    ...milestones.slice(0, 4).map((r) => ({ tone: 'info', text: `${r.title}: milestone in ${r.timeToReady} months` })),
  ]
}

const roleQuickCards = (rows) =>
  `<div class="role-grid">${rows
    .map(
      (r) => `<button class="card role-quick" data-role="${r.id}">
        <h4>${esc(r.title)}</h4>
        <p>${esc(r.functionArea)}</p>
        <p><strong>Risk:</strong> ${r.riskScore} (${r.riskTier})</p>
        <p><strong>Best Gap:</strong> ${r.bestGap}</p>
      </button>`,
    )
    .join('')}</div>`

const tagGapTable = (role) => `
  <div class="table-wrap">
    <table class="table compact">
      <thead><tr><th>Successor</th>${Object.keys(tagTargets)
        .map((tag) => `<th>${tag}</th>`)
        .join('')}</tr></thead>
      <tbody>
        ${role.successors
          .map(
            (s) => `<tr><td>${s.label}</td>${Object.keys(tagTargets)
              .map((tag) => `<td>${s.tagGaps[tag]}</td>`)
              .join('')}</tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
`

const dashboardPage = () => {
  const rows = filteredRoles()
  const successors = allSuccessors()
  const tagsAvg = Object.fromEntries(Object.keys(tagTargets).map((tag) => [tag, avg(successors.map((s) => s.tagGaps[tag]))]))

  const readinessBuckets = {
    Immediate: successors.filter((s) => s.category === 'Immediate').length,
    'Short-Term': successors.filter((s) => s.category === 'Short-Term').length,
    'Medium-Term': successors.filter((s) => s.category === 'Medium-Term').length,
    'Needs Development': successors.filter((s) => s.category === 'Needs Development').length,
  }

  const total = successors.length || 1
  const kpis = kpiData().slice(0, 6)

  return `
    <section class="kpi-grid">
      ${kpis
        .map(
          (k) => `<article class="card kpi" tabindex="0">
            <p class="kpi-value">${k.value}</p>
            <p>${esc(k.label)}</p>
            <span class="trend">${k.trend}</span>
            <div class="kpi-hover">
              <p><strong>Definition:</strong> ${esc(k.definition)}</p>
              <p><strong>Calculation:</strong> ${esc(k.calculation)}</p>
              <p><strong>Why it matters:</strong> ${esc(k.why)}</p>
              <p><strong>Trend:</strong> ${k.trend}</p>
            </div>
          </article>`,
        )
        .join('')}
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Readiness Donut</h3>
        <div class="donut" style="--p:${Math.round(((readinessBuckets.Immediate + readinessBuckets['Short-Term']) / total) * 100)}">
          <span>${Math.round(((readinessBuckets.Immediate + readinessBuckets['Short-Term']) / total) * 100)}%</span>
        </div>
        <p class="muted">Immediate + Short-Term bench readiness share</p>
      </article>
      <article class="card">
        <h3>Risk Heatmap (16 × 3)</h3>
        ${roleHeatmap(rows)}
      </article>
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Tag Gap Radar</h3>
        ${radarSvg(tagsAvg)}
      </article>
      <article class="card">
        <h3>Leadership Pipeline Funnel</h3>
        <div class="funnel">
          ${Object.entries(readinessBuckets)
            .map(
              ([label, count], idx) => `<div class="funnel-row level-${idx + 1}"><span>${label}</span><strong>${count}</strong></div>`,
            )
            .join('')}
        </div>
      </article>
    </section>

    <section class="card">
      <h3>Critical Alerts Strip</h3>
      <div class="alerts">
        ${criticalAlerts()
          .map((a) => `<button class="alert ${a.tone}">${a.text}</button>`)
          .join('')}
      </div>
    </section>

    <section class="card">
      <h3>Quick Access: Critical Roles</h3>
      ${roleQuickCards(rows)}
    </section>
  `
}

const criticalRoleExplorerPage = () => {
  const rows = filteredRoles()
  const role = selectedRole()
  if (!rows.find((r) => r.id === role.id)) {
    state.roleId = rows[0]?.id ?? roles[0].id
  }

  return `
    <section class="card">
      <h3>Role List View</h3>
      ${roleQuickCards(rows)}
    </section>

    <section class="card">
      <h3>Role Detail: ${role.title}</h3>
      <p class="muted">Function: ${role.functionArea} · Strategic Importance: ${role.strategicImportance} · Best Gap: ${role.bestGap}</p>
      ${tagGapTable(role)}
      <div class="successor-grid">
        ${role.successors
          .map(
            (s) => `<article class="mini">
              <p>${s.label}</p>
              <h4>${s.category}</h4>
              <p>Readiness: ${s.readinessPct}%</p>
              <p>Time-to-Ready: ${s.monthsToReady} months</p>
            </article>`,
          )
          .join('')}
      </div>
    </section>
  `
}

const successorProfilePage = () => {
  const role = selectedRole()
  const successor = role.successors.find((s) => s.id === state.successorId) ?? role.successors[0]
  state.successorId = successor.id

  const sections = [
    'Header + Role Context',
    'Readiness Gauge',
    'EDI Breakdown',
    'Tag Gap Snapshot',
    'Vedanta Competency Fit',
    'Strength Clusters',
    'Critical Gaps',
    'Functional vs Behavioural Split',
    'Time-to-Ready Forecast',
    'Bench Contribution',
    'Comparative Rank',
    'Risk Flags',
    'Trajectory View',
    'Development Priorities',
    'Intervention Recommendations',
    'IDP Snapshot',
    'Decision Log Notes',
  ]

  return `
    <section class="card">
      <h3>Successor Profile (Deep-Dive)</h3>
      <div class="chip-row">
        ${role.successors.map((s) => `<button class="chip ${s.id === successor.id ? 'chip-active' : ''}" data-successor="${esc(s.id)}">${esc(s.label)}</button>`).join('')}
      </div>
      <p class="muted"><strong>${role.title}</strong> · ${successor.label} · ${successor.category} · ${successor.readinessPct}% readiness · ${successor.monthsToReady} months to ready</p>
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Tag Gaps</h3>
        ${Object.entries(successor.tagGaps)
          .map(([tag, gap]) => `<div class="bar-row"><span>${tag}</span><div class="bar"><i style="width:${Math.min(100, gap * 30)}%"></i></div><strong>${gap}</strong></div>`)
          .join('')}
      </article>
      <article class="card">
        <h3>Vedanta Competency Scores</h3>
        ${Object.entries(successor.competencyScores)
          .map(([name, score]) => `<div class="bar-row"><span>${name}</span><div class="bar"><i style="width:${score * 20}%"></i></div><strong>${score}</strong></div>`)
          .join('')}
      </article>
    </section>

    <section class="card">
      <h3>17 Analytical Sections (PRD Coverage)</h3>
      <ol class="setting-list">
        ${sections.map((s) => `<li>${s}</li>`).join('')}
      </ol>
    </section>
  `
}

const eligibleCandidatePage = () => {
  const role = selectedRole()
  const candidates = Array.from({ length: 6 }).map((_, i) => {
    const score = round(58 + pseudo(i * 13 + role.bestGap * 100) * 35)
    return {
      label: `Candidate ${i + 1}`,
      fit: score,
      source: i % 2 ? 'Internal Adjacent Role' : 'External Market',
      coverage: i % 3 ? 'Strong Functional Match' : 'Leadership Potential Match',
      risk: i < 2 ? 'Low' : i < 4 ? 'Medium' : 'High',
    }
  })

  return `
    <section class="card">
      <h3>Eligible Candidate Layer</h3>
      <p class="muted">Role target: <strong>${role.title}</strong> · Candidate pool shows dummy PRD-aligned alternatives.</p>
      <div class="role-grid">
        ${candidates
          .map(
            (c) => `<article class="card mini">
              <p>${c.label}</p>
              <h4>${c.fit}% fit</h4>
              <p>${c.source}</p>
              <p>${c.coverage}</p>
              <span class="badge ${c.risk.toLowerCase()}">${c.risk} risk</span>
            </article>`,
          )
          .join('')}
      </div>
    </section>
  `
}

const tagDevelopmentPage = () => {
  const successors = allSuccessors()
  const interventions = {
    STR: ['Strategic labs', 'CEO shadowing', 'Board simulation'],
    OPS: ['Plant rotation', 'SOP mastery sprint', 'Reliability bootcamp'],
    BUS: ['P&L simulation', 'Commercial negotiation clinics', 'Market strategy project'],
    LEAD: ['Executive coaching', 'Team leadership lab', 'Conflict management pathway'],
    TRANS: ['Digital transformation studio', 'Analytics immersion', 'Automation deployment mission'],
  }

  const focus = Object.keys(tagTargets).map((tag) => {
    const affected = successors.filter((s) => s.tagGaps[tag] > 0.8).length
    const closure = round(avg(successors.map((s) => s.tagGaps[tag])))
    return { tag, affected, closure, plans: interventions[tag] }
  })

  return `
    <section class="card">
      <h3>Tag-Based Development System</h3>
      <div class="role-grid">
        ${focus
          .map(
            (f) => `<article class="mini">
              <p>${f.tag} Focus Area</p>
              <h4>${f.affected} successors impacted</h4>
              <p>Gap closure opportunity: ${f.closure}</p>
              <ul class="setting-list">${f.plans.map((p) => `<li>${p}</li>`).join('')}</ul>
            </article>`,
          )
          .join('')}
      </div>
    </section>
  `
}

const riskIntelligencePage = () => {
  const roleSet = filteredRoles().slice().sort((a, b) => b.riskScore - a.riskScore)
  const successors = allSuccessors()
  const vacancyRisk = round(avg(roleSet.map((r) => r.riskScore)))
  const coverage = round(successors.filter((s) => s.overallGap <= 0.8).length / (successors.length || 1))
  const depth = round(avg(roleSet.map((r) => r.benchStrengthRole)))
  const avgTtr = round(avg(roleSet.map((r) => r.timeToReady)))
  const replacement = roleSet.filter((r) => r.hasImmediateReplacement).length

  return `
    <section class="kpi-grid kpi-5">
      <article class="card kpi"><p class="kpi-value">${vacancyRisk}</p><p>Vacancy Risk</p></article>
      <article class="card kpi"><p class="kpi-value">${coverage}</p><p>Coverage</p></article>
      <article class="card kpi"><p class="kpi-value">${depth}</p><p>Readiness Depth</p></article>
      <article class="card kpi"><p class="kpi-value">${avgTtr} mo</p><p>Time-to-Ready</p></article>
      <article class="card kpi"><p class="kpi-value">${replacement}</p><p>Immediate Replacement</p></article>
    </section>

    <section class="card">
      <h3>Interactive Risk Heatmap</h3>
      ${roleHeatmap(roleSet)}
    </section>

    <section class="card">
      <h3>Vulnerability Matrix</h3>
      <div class="table-wrap">
        <table class="table compact">
          <thead><tr><th>Role</th><th>Vacancy Risk</th><th>Criticality</th><th>Coverage</th><th>Depth</th><th>Time-to-Ready</th><th>Availability</th><th>Immediate Replacement</th></tr></thead>
          <tbody>
            ${roleSet
              .map(
                (r) => `<tr>
                  <td>${r.title}</td>
                  <td>${r.riskScore}</td>
                  <td>${r.strategicImportance}</td>
                  <td>${r.successors.length}/3</td>
                  <td>${r.benchStrengthRole}</td>
                  <td>${r.timeToReady} mo</td>
                  <td>${r.riskTier}</td>
                  <td>${r.hasImmediateReplacement ? 'Yes' : 'No'}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

const scenarioPlanningPage = () => {
  const role = selectedRole()
  const projected = role.successors
    .map((s) => {
      const uplift = round(
        Math.min(
          1.5,
          state.timelineMonths / TIMELINE_MONTH_MAX + (state.scenarioType === 'Custom What-If' ? SCENARIO_CUSTOM_BONUS : SCENARIO_DEFAULT_BONUS),
        ),
      )
      const projectedGap = round(Math.max(0, s.overallGap - uplift))
      return {
        label: s.label,
        current: s.overallGap,
        projected: projectedGap,
        category: readinessCategory(projectedGap),
      }
    })
    .sort((a, b) => a.projected - b.projected)

  return `
    <section class="card">
      <h3>Scenario Builder (0–60 months)</h3>
      <div class="scenario-controls">
        <label>Scenario Type
          <select id="scenarioType">
            ${['Single Role Transition', 'Multi-Role Cascade', 'Function-Wide Disruption', 'Custom What-If']
              .map((t) => `<option ${state.scenarioType === t ? 'selected' : ''}>${t}</option>`)
              .join('')}
          </select>
        </label>
        <label>Role
          <select id="roleSelect">
            ${filteredRoles().map((r) => `<option value="${r.id}" ${state.roleId === r.id ? 'selected' : ''}>${r.title}</option>`).join('')}
          </select>
        </label>
        <label>Timeline: <strong>${state.timelineMonths} months</strong></label>
        <input id="timeline" type="range" min="0" max="${TIMELINE_MONTH_MAX}" step="6" value="${state.timelineMonths}" />
      </div>
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Readiness Trajectory Output</h3>
        ${projected
          .map(
            (p) => `<div class="bar-row"><span>${p.label}</span><div class="bar"><i style="width:${Math.min(100, p.projected * 20)}%"></i></div><strong>${p.projected}</strong></div>`,
          )
          .join('')}
      </article>
      <article class="card">
        <h3>Simulation Summary</h3>
        <div class="scenario-grid">
          <article class="mini"><p>Best Successor</p><h4>${projected[0].label}</h4></article>
          <article class="mini"><p>Projected Category</p><h4>${projected[0].category}</h4></article>
          <article class="mini"><p>Residual Gap</p><h4>${projected[0].projected}</h4></article>
        </div>
        <p class="muted">Quick what-if presets: CHRO exit, full training completion, Successor 1 exits in 12 months, 50% acceleration.</p>
      </article>
    </section>
  `
}

const analyticsHubPage = () => {
  const roleSet = filteredRoles()
  const successors = allSuccessors()
  const byFunction = roleSet.reduce((acc, role) => {
    if (!acc[role.functionArea]) acc[role.functionArea] = []
    acc[role.functionArea].push(role)
    return acc
  }, {})

  return `
    <section class="kpi-grid">
      <article class="card kpi"><p class="kpi-value">${roleSet.length}</p><p>Roles in scope</p></article>
      <article class="card kpi"><p class="kpi-value">${successors.length}</p><p>Successor records</p></article>
      <article class="card kpi"><p class="kpi-value">${avg(roleSet.map((r) => r.riskScore))}</p><p>Avg risk score</p></article>
      <article class="card kpi"><p class="kpi-value">${avg(successors.map((s) => s.readinessPct))}%</p><p>Avg readiness%</p></article>
      <article class="card kpi"><p class="kpi-value">${avg(successors.map((s) => s.monthsToReady))} mo</p><p>Avg time-to-ready</p></article>
      <article class="card kpi"><p class="kpi-value">${avg(successors.map((s) => s.tagGaps.TRANS))}</p><p>TRANS avg gap</p></article>
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Function Analytics</h3>
        <table class="table compact">
          <thead><tr><th>Function</th><th>Roles</th><th>Avg Risk</th><th>Bench Strength</th></tr></thead>
          <tbody>
            ${Object.entries(byFunction)
              .map(
                ([fn, set]) => `<tr><td>${fn}</td><td>${set.length}</td><td>${avg(set.map((r) => r.riskScore))}</td><td>${avg(set.map((r) => r.benchStrengthRole))}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>Tag Gap Analytics</h3>
        ${Object.keys(tagTargets)
          .map((tag) => `<div class="bar-row"><span>${tag}</span><div class="bar"><i style="width:${Math.min(100, avg(successors.map((s) => s.tagGaps[tag])) * 28)}%"></i></div><strong>${avg(successors.map((s) => s.tagGaps[tag]))}</strong></div>`)
          .join('')}
      </article>
    </section>
  `
}

const developmentEnginePage = () => {
  const queue = filteredRoles()
    .flatMap((role) =>
      role.successors.map((s) => ({
        role: role.title,
        successor: s.label,
        priority: s.overallGap > 1.5 ? 'Critical' : s.overallGap > 1 ? 'High' : s.overallGap > 0.8 ? 'Medium' : 'Low',
        uplift: round(Math.min(1.2, s.overallGap * 0.6)),
        timeline: s.monthsToReady,
        focus: [...s.developmentAreas, ...s.criticalGaps].join(', ') || 'Sustain strengths',
      })),
    )
    .sort((a, b) => b.timeline - a.timeline)

  return `
    <section class="card">
      <h3>Development Queue</h3>
      <div class="table-wrap">
        <table class="table compact">
          <thead><tr><th>Priority</th><th>Role</th><th>Successor</th><th>Expected Uplift</th><th>Timeline</th><th>Focus</th></tr></thead>
          <tbody>
            ${queue
              .slice(0, 18)
              .map(
                (q) => `<tr><td>${q.priority}</td><td>${q.role}</td><td>${q.successor}</td><td>${q.uplift}</td><td>${q.timeline} mo</td><td>${q.focus}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="split two-up">
      <article class="card">
        <h3>Intervention Catalogue</h3>
        <ul class="setting-list">
          <li>Formal learning programmes</li>
          <li>Internal stretch projects</li>
          <li>Cross-functional rotations</li>
          <li>Executive coaching and mentoring</li>
          <li>Vedanta group forums</li>
          <li>External certifications</li>
        </ul>
      </article>
      <article class="card">
        <h3>Readiness Uplift Simulation</h3>
        <p class="muted">Timeline: ${state.timelineMonths} months · projected uplift preview active</p>
        ${queue
          .slice(0, 5)
          .map(
            (q) => `<div class="bar-row"><span>${q.successor}</span><div class="bar"><i style="width:${Math.min(100, q.uplift * 60)}%"></i></div><strong>+${q.uplift}</strong></div>`,
          )
          .join('')}
      </article>
    </section>
  `
}

const frameworkSettingsPage = () => `
  <section class="split two-up">
    <article class="card">
      <h3>Frameworks</h3>
      <ul class="setting-list">
        <li><strong>EDI Framework:</strong> Exposure, Decision, Impact scales and formula</li>
        <li><strong>Competency Framework:</strong> 6 Vedanta competencies and target levels</li>
        <li><strong>Gap Logic:</strong> Skill → Tag → Competency → Overall gap chain</li>
        <li><strong>Readiness Logic:</strong> category thresholds and Time-to-Ready mapping</li>
        <li><strong>Strategic Importance:</strong> weighted five-factor score</li>
        <li><strong>Bench Strength:</strong> role/function/org level methods</li>
        <li><strong>Risk Logic:</strong> multi-factor continuity risk model</li>
      </ul>
    </article>
    <article class="card">
      <h3>Settings</h3>
      <ul class="setting-list">
        <li>User management and role-based access controls</li>
        <li>Critical role definitions and target updates</li>
        <li>Audit log, export and search controls</li>
        <li>Notification preferences</li>
        <li>Theme preference (Light / Dark toggle placeholder)</li>
      </ul>
    </article>
  </section>

  <section class="card">
    <h3>Quick Formula Reference</h3>
    <ul class="setting-list">
      <li>EDI Final = ROUND((E + D + I) / 3, 2)</li>
      <li>Overall Readiness Gap = AVERAGE(Vedanta, Functional, Behavioural gaps)</li>
      <li>Readiness % = (1 − Overall Gap / 5) × 100</li>
      <li>Bench Strength (Org) = Count(successors with gap ≤ 0.8) / 48</li>
      <li>SRI = 1 − Average(all overall gaps) / 5</li>
    </ul>
  </section>
`

const pageMap = {
  'Executive Dashboard': dashboardPage,
  'Critical Role Explorer': criticalRoleExplorerPage,
  'Successor Profile': successorProfilePage,
  'Eligible Candidate Layer': eligibleCandidatePage,
  'Tag Development System': tagDevelopmentPage,
  'Risk Intelligence Centre': riskIntelligencePage,
  'Scenario Planning': scenarioPlanningPage,
  'Analytics Hub': analyticsHubPage,
  'Development Engine': developmentEnginePage,
  'Frameworks & Settings': frameworkSettingsPage,
}

const pageSubtitle = {
  'Executive Dashboard': '60-second leadership continuity view with hover-enriched KPIs and primary visuals.',
  'Critical Role Explorer': 'Detailed role cards and successor comparison for all critical roles.',
  'Successor Profile': 'Deep-dive successor analysis aligned to 17 analytical profile sections.',
  'Eligible Candidate Layer': 'Role-fit candidate alternatives for continuity backup planning.',
  'Tag Development System': 'Tag-driven development focus and intervention planning.',
  'Risk Intelligence Centre': 'Multi-dimensional risk intelligence with heatmap and vulnerability matrix.',
  'Scenario Planning': '5-year (0–60 month) scenario simulation and readiness trajectory outputs.',
  'Analytics Hub': 'Cross-cutting analytics with function and tag-level intelligence.',
  'Development Engine': 'Queue-driven interventions and readiness uplift simulation.',
  'Frameworks & Settings': 'Methodology reference, formulas, and platform administration controls.',
}

const functionFilter = () => {
  const allSelected = state.selectedFunctions.length === functions.length
  return `
    <div class="multi-filter">
      <div class="filter-actions">
        <button class="chip ${allSelected ? 'chip-active' : ''}" data-filter-action="all">Select All</button>
        <button class="chip" data-filter-action="clear">Clear</button>
      </div>
      <div class="chip-row">
        ${functions
          .map(
            (fn) => `<button class="chip ${state.selectedFunctions.includes(fn) ? 'chip-active' : ''}" data-function="${fn}">${fn}</button>`,
          )
          .join('')}
      </div>
    </div>
  `
}

const ensureState = () => {
  const rows = filteredRoles()
  if (!rows.some((r) => r.id === state.roleId)) {
    state.roleId = rows[0]?.id ?? roles[0].id
  }
  const role = selectedRole()
  if (!role.successors.some((s) => s.id === state.successorId)) {
    state.successorId = role.successors[0]?.id ?? state.successorId
  }
}

const render = () => {
  ensureState()
  const currentPage = navItems.includes(state.page) ? state.page : navItems[0]
  state.page = currentPage

  document.querySelector('#app').innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <h1>BALCO Succession Intelligence</h1>
        <nav>
          ${navItems
            .map((item) => `<button class="nav ${currentPage === item ? 'active' : ''}" data-page="${esc(item)}">${esc(item)}</button>`)
            .join('')}
        </nav>
      </aside>

      <main>
        <header class="topbar card">
          <div>
            <h2>${esc(currentPage)}</h2>
            <p class="muted">${esc(pageSubtitle[currentPage])}</p>
          </div>
          <div>
            <p class="muted">Function Filter (multi-select)</p>
            ${functionFilter()}
          </div>
        </header>

        ${(pageMap[currentPage] ?? dashboardPage)()}
      </main>
    </div>
  `

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextPage = button.getAttribute('data-page')
      if (nextPage && navItems.includes(nextPage)) state.page = nextPage
      render()
    })
  })

  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextRoleId = button.getAttribute('data-role')
      if (nextRoleId && roleById[nextRoleId]) state.roleId = nextRoleId
      const successor = selectedRole().successors[0]
      state.successorId = successor?.id
      render()
    })
  })

  document.querySelectorAll('[data-successor]').forEach((button) => {
    button.addEventListener('click', () => {
      const successorId = button.getAttribute('data-successor')
      if (successorId && selectedRole().successors.some((s) => s.id === successorId)) state.successorId = successorId
      render()
    })
  })

  document.querySelectorAll('[data-function]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-function')
      if (!value || !functions.includes(value)) return
      if (state.selectedFunctions.includes(value)) {
        state.selectedFunctions = state.selectedFunctions.filter((f) => f !== value)
      } else {
        state.selectedFunctions = [...state.selectedFunctions, value]
      }
      if (!state.selectedFunctions.length) state.selectedFunctions = [...functions]
      render()
    })
  })

  document.querySelectorAll('[data-filter-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-filter-action')
      state.selectedFunctions = action === 'all' ? [...functions] : []
      render()
    })
  })

  document.querySelector('#timeline')?.addEventListener('input', (event) => {
    state.timelineMonths = Number(event.target.value)
    render()
  })

  document.querySelector('#roleSelect')?.addEventListener('change', (event) => {
    if (roleById[event.target.value]) state.roleId = event.target.value
    state.successorId = selectedRole().successors[0]?.id ?? state.successorId
    render()
  })

  document.querySelector('#scenarioType')?.addEventListener('change', (event) => {
    const options = ['Single Role Transition', 'Multi-Role Cascade', 'Function-Wide Disruption', 'Custom What-If']
    if (options.includes(event.target.value)) state.scenarioType = event.target.value
    render()
  })
}

render()
