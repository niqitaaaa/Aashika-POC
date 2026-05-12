import './style.css'

const rolesSeed = [
  ['CHRO', 'Human Resources'],
  ['CFO', 'Finance'],
  ['CCO', 'Contracts & Procurement'],
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
  ['Head Corp. Affairs, Raipur', 'Raipur Office Corporate Affairs'],
]

const vedantaCompetencies = [
  'stretches_drives',
  'business_acumen',
  'external_internal_env',
  'develops_people',
  'thinks_strategically',
  'leads_change',
]

const tagTargets = {
  STR: 4.8,
  OPS: 4.5,
  BUS: 4.6,
  LEAD: 4.7,
  TRANS: 4.4,
}

const round = (value) => Number(value.toFixed(2))

const ediFinal = (E, D, I) => round((E + D + I) / 3)

const avg = (values) => {
  const valid = values.filter((v) => Number.isFinite(v))
  if (!valid.length) return null
  return round(valid.reduce((sum, v) => sum + v, 0) / valid.length)
}

const readinessCategory = (gap) => {
  if (gap <= 0.3) return 'Immediate'
  if (gap <= 0.8) return 'Short-Term'
  if (gap <= 1.5) return 'Medium-Term'
  return 'Needs Development'
}

const pseudo = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const buildSkills = (roleIndex, successorIndex) => {
  const tags = ['STR', 'OPS', 'BUS', 'LEAD', 'TRANS']
  const skills = []
  tags.forEach((tag, tagIndex) => {
    for (let i = 0; i < 3; i++) {
      const seed = roleIndex * 101 + successorIndex * 37 + tagIndex * 11 + i * 5
      const base = 2.6 + pseudo(seed) * 2.2
      const E = round(Math.max(1, Math.min(5, base + 0.15)))
      const D = round(Math.max(1, Math.min(5, base - 0.1)))
      const I = round(Math.max(1, Math.min(5, base + 0.05)))
      const final = ediFinal(E, D, I)
      skills.push({
        skill: `${tag} Skill ${i + 1}`,
        tag,
        E,
        D,
        I,
        final,
        type: i === 2 ? 'behavioural' : 'functional',
      })
    }
  })
  return skills
}

const buildSuccessor = (role, roleIndex, successorIndex) => {
  const skills = buildSkills(roleIndex, successorIndex)
  const vedantaScores = Object.fromEntries(
    vedantaCompetencies.map((name, idx) => {
      const score = round(2.8 + pseudo(roleIndex * 61 + successorIndex * 23 + idx * 7) * 2)
      return [name, Math.max(1, Math.min(5, score))]
    }),
  )

  const tagAverages = Object.fromEntries(
    Object.keys(tagTargets).map((tag) => [tag, avg(skills.filter((s) => s.tag === tag).map((s) => s.final))]),
  )

  const tagGaps = Object.fromEntries(
    Object.entries(tagAverages).map(([tag, value]) => [tag, value === null ? null : round(tagTargets[tag] - value)]),
  )

  const vedantaGaps = vedantaCompetencies.map((k) => round(4.6 - vedantaScores[k]))
  const vedantaAvgGap = avg(vedantaGaps)
  const functionalAvgGap = avg(skills.filter((s) => s.type === 'functional').map((s) => tagTargets[s.tag] - s.final))
  const behaviouralAvgGap = avg(skills.filter((s) => s.type === 'behavioural').map((s) => tagTargets[s.tag] - s.final))
  const overallReadiness = avg([vedantaAvgGap, functionalAvgGap, behaviouralAvgGap])

  const strengths = Object.entries(tagGaps)
    .filter(([, gap]) => gap !== null && gap <= 0.3)
    .map(([tag]) => `${tag} capability`)

  const developmentAreas = Object.entries(tagGaps)
    .filter(([, gap]) => gap !== null && gap > 0.3 && gap <= 1.5)
    .map(([tag]) => `${tag} uplift`)

  const criticalGaps = Object.entries(tagGaps)
    .filter(([, gap]) => gap !== null && gap > 1.5)
    .map(([tag]) => `${tag} critical closure`)

  return {
    id: `${role.id}-s${successorIndex + 1}`,
    displayLabel: `Successor ${successorIndex + 1}`,
    vedantaScores,
    vedantaAvgGap,
    tagAverages,
    tagGaps,
    overallReadiness,
    readinessCategory: readinessCategory(overallReadiness),
    strengths,
    developmentAreas,
    criticalGaps,
  }
}

const roles = rolesSeed.map(([title, area], idx) => {
  const role = {
    id: `role-${idx + 1}`,
    title,
    functionArea: area,
    strategicImportance: round(0.65 + pseudo(idx * 17) * 0.35),
    roleTagTargets: { ...tagTargets },
  }
  const successors = [0, 1, 2].map((sIdx) => buildSuccessor(role, idx + 1, sIdx + 1))
  const readinessGaps = successors.map((s) => s.overallReadiness)
  const bestGap = Math.min(...readinessGaps)
  const hasImmediate = successors.some((s) => s.readinessCategory === 'Immediate')
  const allAbove1 = successors.every((s) => s.overallReadiness > 1)
  role.successors = successors
  role.bestSuccessorGap = round(bestGap)
  role.riskScore = round(0.5 * (hasImmediate ? 0 : 1) + 0.3 * (allAbove1 ? 1 : 0) + 0.2 * role.strategicImportance)
  role.readinessCategory = readinessCategory(bestGap)
  return role
})

const state = {
  page: 'Dashboard',
  filter: 'All Functions',
  roleId: roles[0]?.id,
  scenarioMonths: 6,
}

const filters = ['All Functions', ...new Set(roles.map((r) => r.functionArea))]

const filteredRoles = () =>
  state.filter === 'All Functions' ? roles : roles.filter((role) => role.functionArea === state.filter)

const allSuccessors = () => filteredRoles().flatMap((role) => role.successors)

const metrics = () => {
  const successors = allSuccessors()
  const roleSet = filteredRoles()
  const avgGap = avg(successors.map((s) => s.overallReadiness)) ?? 0
  const sri = round(1 - avgGap / 5)
  const benchStrength = successors.length
    ? round(successors.filter((s) => s.overallReadiness <= 0.8).length / successors.length)
    : 0
  const noReadyRoles = roleSet.filter((r) => r.successors.every((s) => s.overallReadiness > 0.8)).length
  const highRiskRoles = roleSet.filter((r) => r.riskScore >= 0.6).length

  return {
    totalRoles: roleSet.length,
    benchStrength,
    sri,
    noReadyRoles,
    highRiskRoles,
    avgRoleRisk: avg(roleSet.map((r) => r.riskScore)) ?? 0,
  }
}

const distribution = () => {
  const counts = {
    Immediate: 0,
    'Short-Term': 0,
    'Medium-Term': 0,
    'Needs Development': 0,
  }
  allSuccessors().forEach((s) => {
    counts[s.readinessCategory] += 1
  })
  return counts
}

const selectedRole = () => filteredRoles().find((r) => r.id === state.roleId) ?? filteredRoles()[0] ?? roles[0]

const scenario = () => {
  const role = selectedRole()
  if (!role) {
    return { best: '-', residual: '-', acceleration: '-' }
  }
  const projected = role.successors.map((s) => {
    const improvement = round(Math.min(0.5, state.scenarioMonths * 0.03))
    const projectedGap = round(Math.max(0, s.overallReadiness - improvement))
    return { ...s, projectedGap, projectedCategory: readinessCategory(projectedGap) }
  })
  projected.sort((a, b) => a.projectedGap - b.projectedGap)
  const best = projected[0]
  return {
    best: `${best.displayLabel} (${best.projectedCategory})`,
    residual: best.projectedGap,
    acceleration: best.projectedGap <= 0.8 ? 'Low' : best.projectedGap <= 1.2 ? 'Medium' : 'High',
  }
}

const roleButton = (role) =>
  `<button class="chip ${state.roleId === role.id ? 'chip-active' : ''}" data-role="${role.id}">${role.title}</button>`

const tagGapTable = (role) =>
  `<table class="table">
    <thead><tr><th>Successor</th>${Object.keys(tagTargets)
      .map((tag) => `<th>${tag}</th>`)
      .join('')}</tr></thead>
    <tbody>
      ${role.successors
        .map(
          (s) => `<tr><td>${s.displayLabel}</td>${Object.keys(tagTargets)
            .map((tag) => `<td>${s.tagGaps[tag] ?? '-'}</td>`)
            .join('')}</tr>`,
        )
        .join('')}
    </tbody>
  </table>`

const successorCard = (s) =>
  `<article class="card successor">
      <h4>${s.displayLabel}</h4>
      <p class="muted">Readiness: <strong>${s.readinessCategory}</strong> (gap ${s.overallReadiness})</p>
      <p class="muted">Vedanta Avg Gap: ${s.vedantaAvgGap}</p>
      <div class="pill-row">
        ${s.strengths.slice(0, 3).map((t) => `<span class="pill good">${t}</span>`).join('')}
        ${s.developmentAreas.slice(0, 2).map((t) => `<span class="pill warn">${t}</span>`).join('')}
        ${s.criticalGaps.slice(0, 2).map((t) => `<span class="pill bad">${t}</span>`).join('')}
      </div>
     </article>`

const pageCopy = {
  Dashboard: {
    title: 'Strategic Dashboard',
    subtitle: 'PRD-based POC for BALCO critical-role succession intelligence',
  },
  Roles: {
    title: 'Roles',
    subtitle: 'Critical-role inventory with successor depth, gaps, and readiness',
  },
  Analytics: {
    title: 'Analytics',
    subtitle: 'Comparative view of readiness, competencies, and function-level strength',
  },
  Risk: {
    title: 'Risk',
    subtitle: 'Role continuity risk posture and succession risk watchlist',
  },
  Development: {
    title: 'Development',
    subtitle: 'Focused development interventions for successor readiness uplift',
  },
  Settings: {
    title: 'Settings',
    subtitle: 'Platform assumptions, thresholds, and scoring controls',
  },
}

const navItems = Object.keys(pageCopy)

const groupedByFunction = (roleSet) =>
  roleSet.reduce((acc, role) => {
    if (!acc[role.functionArea]) acc[role.functionArea] = []
    acc[role.functionArea].push(role)
    return acc
  }, {})

const dashboardPage = () => {
  const currentRoles = filteredRoles()
  const m = metrics()
  const dist = distribution()
  const role = selectedRole()
  if (role) state.roleId = role.id
  const sc = scenario()

  return `
    <section class="kpi-grid">
      <article class="card kpi"><h3>${m.totalRoles}</h3><p>Critical Roles</p></article>
      <article class="card kpi"><h3>${m.benchStrength}</h3><p>Bench Strength Score</p></article>
      <article class="card kpi"><h3>${m.sri}</h3><p>Succession Readiness Index</p></article>
      <article class="card kpi"><h3>${m.noReadyRoles}</h3><p>No Ready Successor Roles</p></article>
      <article class="card kpi"><h3>${m.highRiskRoles}</h3><p>High-Risk Roles</p></article>
      <article class="card kpi"><h3>${m.avgRoleRisk}</h3><p>Average Role Risk Score</p></article>
    </section>

    <section class="split">
      <article class="card">
        <h3>Readiness Distribution</h3>
        ${Object.entries(dist)
          .map(
            ([label, count]) => `<div class="bar-row"><span>${label}</span><div class="bar"><i style="width:${Math.min(
              100,
              count * 7,
            )}%"></i></div><strong>${count}</strong></div>`,
          )
          .join('')}
      </article>
      <article class="card">
        <h3>Risk Heat View (Top Roles)</h3>
        <table class="table compact">
          <thead><tr><th>Role</th><th>Risk</th><th>Best Gap</th></tr></thead>
          <tbody>
          ${currentRoles
            .slice()
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 8)
            .map((r) => `<tr><td>${r.title}</td><td>${r.riskScore}</td><td>${r.bestSuccessorGap}</td></tr>`)
            .join('')}
          </tbody>
        </table>
      </article>
    </section>

    <section class="card">
      <h3>Quick Access: Critical Roles</h3>
      <div class="chip-row">${currentRoles.map(roleButton).join('')}</div>
    </section>

    <section class="card">
      <h3>Critical Role Explorer</h3>
      <p class="muted"><strong>${role?.title ?? '-'}</strong> · ${role?.functionArea ?? '-'} · Risk ${role?.riskScore ?? '-'}</p>
      <div class="successor-grid">
        ${(role?.successors ?? []).map(successorCard).join('')}
      </div>
      <h4>Tag Gap Analysis (Role Target − Successor Avg)</h4>
      ${role ? tagGapTable(role) : '<p>No role selected.</p>'}
    </section>

    <section class="card">
      <h3>Scenario Planning (0–24 months)</h3>
      <div class="scenario-controls">
        <label>Timeline: <strong>${state.scenarioMonths} months</strong></label>
        <input id="timeline" type="range" min="0" max="24" value="${state.scenarioMonths}" />
      </div>
      <div class="scenario-grid">
        <article class="mini"><p>Best Successor at Date</p><h4>${sc.best}</h4></article>
        <article class="mini"><p>Residual Gap</p><h4>${sc.residual}</h4></article>
        <article class="mini"><p>Acceleration Required</p><h4>${sc.acceleration}</h4></article>
      </div>
    </section>
  `
}

const rolesPage = () => {
  const currentRoles = filteredRoles()
  const role = selectedRole()
  if (role) state.roleId = role.id
  return `
    <section class="card">
      <h3>Role Directory</h3>
      <p class="muted">Total roles in scope: <strong>${currentRoles.length}</strong></p>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Role</th><th>Function</th><th>Strategic Importance</th><th>Risk</th><th>Best Gap</th><th>Readiness</th></tr></thead>
          <tbody>
            ${currentRoles
              .map(
                (r) =>
                  `<tr><td>${r.title}</td><td>${r.functionArea}</td><td>${r.strategicImportance}</td><td>${r.riskScore}</td><td>${r.bestSuccessorGap}</td><td>${r.readinessCategory}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h3>Select Role for Successor Detail</h3>
      <div class="chip-row">${currentRoles.map(roleButton).join('')}</div>
    </section>

    <section class="card">
      <h3>${role?.title ?? '-'}</h3>
      <p class="muted">${role?.functionArea ?? '-'} · Risk ${role?.riskScore ?? '-'}</p>
      <div class="successor-grid">
        ${(role?.successors ?? []).map(successorCard).join('')}
      </div>
      ${role ? tagGapTable(role) : '<p class="muted">No role selected.</p>'}
    </section>
  `
}

const analyticsPage = () => {
  const roleSet = filteredRoles()
  const successors = allSuccessors()
  const byFunction = groupedByFunction(roleSet)
  const tagGapAvg = Object.keys(tagTargets).map((tag) => {
    const value = avg(successors.map((s) => s.tagGaps[tag]))
    return [tag, value ?? 0]
  })

  return `
    <section class="kpi-grid">
      <article class="card kpi"><h3>${round(avg(roleSet.map((r) => r.strategicImportance)) ?? 0)}</h3><p>Avg Strategic Importance</p></article>
      <article class="card kpi"><h3>${round(avg(successors.map((s) => s.overallReadiness)) ?? 0)}</h3><p>Avg Readiness Gap</p></article>
      <article class="card kpi"><h3>${successors.filter((s) => s.readinessCategory === 'Immediate').length}</h3><p>Immediate Successors</p></article>
      <article class="card kpi"><h3>${successors.filter((s) => s.readinessCategory === 'Needs Development').length}</h3><p>Needs Development</p></article>
      <article class="card kpi"><h3>${round(avg(successors.map((s) => s.vedantaAvgGap)) ?? 0)}</h3><p>Avg Vedanta Gap</p></article>
      <article class="card kpi"><h3>${successors.length}</h3><p>Total Bench Count</p></article>
    </section>

    <section class="split">
      <article class="card">
        <h3>Function Analytics</h3>
        <table class="table compact">
          <thead><tr><th>Function</th><th>Roles</th><th>Avg Risk</th><th>Avg Best Gap</th></tr></thead>
          <tbody>
            ${Object.entries(byFunction)
              .map(([fn, fnRoles]) => {
                const avgRisk = round(avg(fnRoles.map((r) => r.riskScore)) ?? 0)
                const avgBestGap = round(avg(fnRoles.map((r) => r.bestSuccessorGap)) ?? 0)
                return `<tr><td>${fn}</td><td>${fnRoles.length}</td><td>${avgRisk}</td><td>${avgBestGap}</td></tr>`
              })
              .join('')}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>Average Tag Gap (Across Successors)</h3>
        ${tagGapAvg
          .map(
            ([tag, value]) =>
              `<div class="bar-row"><span>${tag}</span><div class="bar"><i style="width:${Math.min(100, Number(value) * 25)}%"></i></div><strong>${value}</strong></div>`,
          )
          .join('')}
      </article>
    </section>
  `
}

const riskTier = (risk) => (risk >= 0.7 ? 'High' : risk >= 0.5 ? 'Medium' : 'Low')

const riskPage = () => {
  const roleSet = filteredRoles().slice().sort((a, b) => b.riskScore - a.riskScore)
  const tierCounts = roleSet.reduce(
    (acc, role) => {
      acc[riskTier(role.riskScore)] += 1
      return acc
    },
    { High: 0, Medium: 0, Low: 0 },
  )

  return `
    <section class="kpi-grid">
      <article class="card kpi"><h3>${tierCounts.High}</h3><p>High Risk Roles</p></article>
      <article class="card kpi"><h3>${tierCounts.Medium}</h3><p>Medium Risk Roles</p></article>
      <article class="card kpi"><h3>${tierCounts.Low}</h3><p>Low Risk Roles</p></article>
      <article class="card kpi"><h3>${round(avg(roleSet.map((r) => r.riskScore)) ?? 0)}</h3><p>Average Risk Score</p></article>
      <article class="card kpi"><h3>${roleSet.filter((r) => r.bestSuccessorGap > 1).length}</h3><p>Roles With Gap &gt; 1</p></article>
      <article class="card kpi"><h3>${roleSet.length}</h3><p>Total Assessed Roles</p></article>
    </section>

    <section class="card">
      <h3>Risk Watchlist</h3>
      <table class="table">
        <thead><tr><th>Role</th><th>Function</th><th>Risk Score</th><th>Best Gap</th><th>Tier</th><th>Suggested Action</th></tr></thead>
        <tbody>
          ${roleSet
            .map((r) => {
              const tier = riskTier(r.riskScore)
              const action =
                tier === 'High'
                  ? 'Accelerate readiness and add external backup'
                  : tier === 'Medium'
                    ? 'Run targeted development plans'
                    : 'Maintain readiness cadence'
              return `<tr><td>${r.title}</td><td>${r.functionArea}</td><td>${r.riskScore}</td><td>${r.bestSuccessorGap}</td><td><span class="badge ${tier.toLowerCase()}">${tier}</span></td><td>${action}</td></tr>`
            })
            .join('')}
        </tbody>
      </table>
    </section>
  `
}

const developmentPage = () => {
  const developmentPool = filteredRoles().flatMap((role) =>
    role.successors.map((s) => ({
      role: role.title,
      functionArea: role.functionArea,
      successor: s.displayLabel,
      gap: s.overallReadiness,
      category: s.readinessCategory,
      focus: [...s.developmentAreas, ...s.criticalGaps].join(', ') || 'Sustain strengths',
    })),
  )
  const priority = developmentPool.slice().sort((a, b) => b.gap - a.gap)

  return `
    <section class="card">
      <h3>Development Priority Queue</h3>
      <p class="muted">Sorted by highest readiness gap first for focused intervention planning.</p>
      <table class="table compact">
        <thead><tr><th>Role</th><th>Successor</th><th>Function</th><th>Gap</th><th>Category</th><th>Focus Area</th></tr></thead>
        <tbody>
          ${priority
            .slice(0, 15)
            .map(
              (p) =>
                `<tr><td>${p.role}</td><td>${p.successor}</td><td>${p.functionArea}</td><td>${p.gap}</td><td>${p.category}</td><td>${p.focus}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h3>Readiness Uplift Simulation</h3>
      <p class="muted">Assumes monthly uplift of up to 0.03 points for active interventions.</p>
      <div class="scenario-controls">
        <label>Timeline: <strong>${state.scenarioMonths} months</strong></label>
        <input id="timeline" type="range" min="0" max="24" value="${state.scenarioMonths}" />
      </div>
      <div class="chip-row">
        ${filteredRoles()
          .slice(0, 10)
          .map(roleButton)
          .join('')}
      </div>
      <p class="muted">Selected role projection: <strong>${scenario().best}</strong> · Residual gap <strong>${scenario().residual}</strong></p>
    </section>
  `
}

const settingsPage = () => `
  <section class="split">
    <article class="card">
      <h3>Readiness Thresholds</h3>
      <ul class="setting-list">
        <li><strong>Immediate:</strong> gap ≤ 0.3</li>
        <li><strong>Short-Term:</strong> 0.31 to 0.8</li>
        <li><strong>Medium-Term:</strong> 0.81 to 1.5</li>
        <li><strong>Needs Development:</strong> &gt; 1.5</li>
      </ul>
    </article>
    <article class="card">
      <h3>Tag Targets</h3>
      <ul class="setting-list">
        ${Object.entries(tagTargets)
          .map(([tag, value]) => `<li><strong>${tag}:</strong> ${value}</li>`)
          .join('')}
      </ul>
    </article>
  </section>

  <section class="card">
    <h3>Model Setup</h3>
    <ul class="setting-list">
      <li>Successor count per role: <strong>3</strong></li>
      <li>Assessment model: <strong>EDI average</strong></li>
      <li>Vedanta competency baseline: <strong>4.6</strong></li>
      <li>Scenario horizon: <strong>0 to 24 months</strong></li>
    </ul>
  </section>
`

const pageContent = () => {
  if (state.page === 'Roles') return rolesPage()
  if (state.page === 'Analytics') return analyticsPage()
  if (state.page === 'Risk') return riskPage()
  if (state.page === 'Development') return developmentPage()
  if (state.page === 'Settings') return settingsPage()
  return dashboardPage()
}

const render = () => {
  const copy = pageCopy[state.page]

  document.querySelector('#app').innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <h1>Succession Intelligence</h1>
        <nav>
          ${navItems
            .map((item) => `<button class="nav ${state.page === item ? 'active' : ''}" data-page="${item}">${item}</button>`)
            .join('')}
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <h2>${copy.title}</h2>
            <p class="muted">${copy.subtitle}</p>
          </div>
          <label class="filter">Function
            <select id="functionFilter">
              ${filters.map((f) => `<option ${state.filter === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </label>
        </header>

        ${pageContent()}
      </main>
    </div>
  `

  document.querySelector('#functionFilter')?.addEventListener('change', (event) => {
    state.filter = event.target.value
    state.roleId = filteredRoles()[0]?.id ?? roles[0]?.id
    render()
  })

  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      state.roleId = button.getAttribute('data-role')
      render()
    })
  })

  document.querySelector('#timeline')?.addEventListener('input', (event) => {
    state.scenarioMonths = Number(event.target.value)
    render()
  })

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      state.page = button.getAttribute('data-page')
      render()
    })
  })
}

render()
