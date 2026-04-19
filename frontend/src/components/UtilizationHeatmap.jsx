const DEFAULT_DEPARTMENTS = [
  'Faculty of Computing',
  'Engineering Department',
  'Faculty of Business',
  'Architecture Department'
]

const UNASSIGNED_DEPARTMENT = 'Unassigned'

const normalizeDepartmentName = (department) => {
  const value = String(department || '').trim()
  if (value.toLowerCase() === 'faculty of bussiness') {
    return 'Faculty of Business'
  }

  if (!value) {
    return UNASSIGNED_DEPARTMENT
  }

  if (!DEFAULT_DEPARTMENTS.includes(value)) {
    return UNASSIGNED_DEPARTMENT
  }

  return value
}

const getHeatColorClass = (utilization) => {
  const value = Number(utilization || 0)
  if (value <= 30) return 'util-heat-card-low'
  if (value <= 70) return 'util-heat-card-moderate'
  if (value <= 90) return 'util-heat-card-high'
  return 'util-heat-card-critical'
}

export default function UtilizationHeatmap({ data = [] }) {
  const normalizedMap = new Map()

  data.forEach((item) => {
    const department = normalizeDepartmentName(item?.department)

    const existing = normalizedMap.get(department)
    const occupiedResources = Number(item?.occupiedResources ?? 0)
    const totalResources = Number(item?.totalResources ?? 0)

    normalizedMap.set(department, {
      department,
      occupiedResources: (existing?.occupiedResources || 0) + occupiedResources,
      totalResources: (existing?.totalResources || 0) + totalResources
    })
  })

  const displayDepartments = [...DEFAULT_DEPARTMENTS]

  const cards = displayDepartments.map((department) => {
    const item = normalizedMap.get(department)
    const occupiedResources = item?.occupiedResources ?? 0
    const totalResources = item?.totalResources ?? 0
    const utilization = totalResources > 0
      ? Math.round((occupiedResources * 100) / totalResources)
      : 0

    return {
      department,
      utilization,
      occupiedResources,
      totalResources
    }
  })

  return (
    <div className="util-heatmap-section">
      <h3 className="util-heatmap-title">Department Utilization Heatmap</h3>

      <div className="util-heatmap-grid">
        {cards.map((card) => (
          <div
            key={card.department}
            className={`util-heat-card ${getHeatColorClass(card.utilization)}`}
          >
            <div className="util-heat-card-department">{card.department}</div>
            <div className="util-heat-card-percent">{card.utilization}%</div>
            <div className="util-heat-card-meta">
              {card.occupiedResources} / {card.totalResources} Resources
            </div>
          </div>
        ))}
      </div>

      <div className="util-heatmap-legend-wrap">
        <div className="util-heatmap-legend-title">Legend</div>
        <div className="util-heatmap-legend-grid">
          <div className="util-heatmap-legend-item"><span className="util-heatmap-legend-dot util-heat-card-low" />0%-30% Low Traffic</div>
          <div className="util-heatmap-legend-item"><span className="util-heatmap-legend-dot util-heat-card-moderate" />31%-70% Moderate</div>
          <div className="util-heatmap-legend-item"><span className="util-heatmap-legend-dot util-heat-card-high" />71%-90% High</div>
          <div className="util-heatmap-legend-item"><span className="util-heatmap-legend-dot util-heat-card-critical" />91%-100% Critical</div>
        </div>
      </div>
    </div>
  )
}
