import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function HomePage() {
  const [overview, setOverview] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    minCapacity: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadOverview()
    loadResources()
  }, [])

  const loadOverview = async () => {
    const response = await campusApi.get('/home/overview')
    setOverview(response.data)
  }

  const loadResources = async (customFilters = filters) => {
    setLoading(true)
    try {
      const params = {}
      if (customFilters.type) params.type = customFilters.type
      if (customFilters.location) params.location = customFilters.location
      if (customFilters.minCapacity) params.minCapacity = customFilters.minCapacity

      const response = await campusApi.get('/resources/public', { params })
      setResources(response.data)
    } catch (error) {
      console.error('Failed to load resources', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value
    }
    setFilters(nextFilters)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadResources(filters)
  }

  const goToAdmin = () => {
    localStorage.setItem('smart-campus-role', 'ADMIN')
    navigate('/admin')
  }

  const goToUserDashboard = () => {
    if (!localStorage.getItem('smart-campus-user-email')) {
      navigate('/login')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="page-shell">
      <header className="hero-section">
        <nav className="top-nav">
          <div className="brand-wrap">
            <div className="brand-mark">SC</div>
            <div>
              <div className="brand">SmartCampus</div>
              <div className="brand-sub">Operations Hub</div>
            </div>
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#resources">Resources</a>
            <button className="btn-secondary nav-btn" onClick={goToUserDashboard}>User Dashboard</button>
            <button className="btn-secondary nav-btn" onClick={goToAdmin}>Admin Panel</button>
          </div>
        </nav>

        <div className="hero-content container">
          <div className="hero-text">
            <span className="hero-tag">Spring Boot + React + MongoDB</span>
            <h1>{overview?.title || 'Smart Campus Operations Hub'}</h1>
            <p>
              {overview?.subtitle ||
                'A premium web interface to discover campus resources, review availability, and access operations dashboards.'}
            </p>

            <div className="hero-buttons">
              <a href="#resources" className="btn-primary">Browse Resources</a>
              <button className="btn-secondary" onClick={goToAdmin}>Open Admin Dashboard</button>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <strong>Home Page</strong>
                <span>Premium resource search experience</span>
              </div>
              <div className="stat-card">
                <strong>Admin Panel</strong>
                <span>Dashboard cards, filters, and review actions</span>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h3>Why this UI stands out</h3>
            <ul>
              <li>Modern hero section with premium styling</li>
              <li>Filterable campus resource list</li>
              <li>Fast access to the admin management area</li>
              <li>Ready to extend with full booking workflows</li>
            </ul>
          </div>
        </div>
      </header>

      <section id="features" className="feature-section container">
        <div className="section-header center">
          <span className="eyebrow">System Highlights</span>
          <h2>Designed for a clear first impression</h2>
          <p>
            These cards showcase the value of the platform on the home page while keeping the layout clean and easy to explore.
          </p>
        </div>

        <div className="feature-grid">
          {overview?.features?.map((item, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">0{index + 1}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="resource-section container">
        <div className="section-header">
          <div>
            <span className="eyebrow">Catalogue Preview</span>
            <h2>Find available campus resources</h2>
            <p>Search lecture halls, labs, rooms, and equipment from one place.</p>
          </div>
        </div>

        <form className="filter-bar" onSubmit={handleSearch}>
          <input
            type="text"
            name="type"
            placeholder="Type (Lab / Meeting Room)"
            value={filters.type}
            onChange={handleChange}
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleChange}
          />
          <input
            type="number"
            name="minCapacity"
            placeholder="Min Capacity"
            value={filters.minCapacity}
            onChange={handleChange}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        {loading ? (
          <p className="empty-state">Loading resources...</p>
        ) : resources.length === 0 ? (
          <p className="empty-state">No resources found.</p>
        ) : (
          <div className="resource-grid">
            {resources.map((resource) => (
              <div className="resource-card" key={resource.id}>
                <div className="resource-top">
                  <span className="badge">{resource.type}</span>
                  <span className={`status ${String(resource.status).toLowerCase()}`}>
                    {resource.status}
                  </span>
                </div>
                <h3>{resource.name}</h3>
                <p>{resource.location}</p>
                <div className="resource-meta">
                  <span>Capacity: {resource.capacity}</span>
                  <span>{resource.availabilityWindow}</span>
                </div>
                <button className="btn-secondary full-width" onClick={goToUserDashboard}>Book Now</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}