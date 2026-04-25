import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Layers, 
  Box, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

export default function HomePage() {
  const [authProfile, setAuthProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
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
    loadAuthProfile()
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

  const persistProfile = (profile) => {
    if (!profile) return
    localStorage.setItem('smart-campus-user-email', profile.email)
    localStorage.setItem('smart-campus-user-name', profile.name || profile.email)
    localStorage.setItem('smart-campus-role', profile.role)
  }

  const loadAuthProfile = async () => {
    try {
      const response = await campusApi.get('/auth/me')
      const profile = response.data
      persistProfile(profile)
      setAuthProfile({
        ...profile,
        name: profile.name || profile.email
      })
    } catch (error) {
      setAuthProfile(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const goToAdmin = async () => {
    try {
      const response = await campusApi.get('/auth/me')
      persistProfile(response.data)

      if (response.data.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/admin-login')
      }
    } catch (error) {
      navigate('/admin-login')
    }
  }

  const goToUserDashboard = async () => {
    try {
      const response = await campusApi.get('/auth/me')
      persistProfile(response.data)
      if (response.data.role === 'TECHNICIAN') {
        navigate('/technician')
      } else if (response.data.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      navigate('/login')
    }
  }

  const handleLogout = async () => {
    try {
      await campusApi.post('/auth/logout')
    } catch (error) {
      console.error(error)
    }
    localStorage.removeItem('smart-campus-user-email')
    localStorage.removeItem('smart-campus-user-name')
    localStorage.removeItem('smart-campus-role')
    setAuthProfile(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200">
                SC
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 leading-tight">SmartCampus</div>
                <div className="text-[10px] uppercase tracking-wider text-primary-600 font-bold">Operations Hub</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</a>
              <a href="#resources" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Resources</a>
              <div className="h-6 w-px bg-slate-200"></div>
              <button 
                onClick={goToUserDashboard}
                className="text-sm font-medium text-slate-600 hover:text-primary-600 flex items-center gap-2"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button 
                onClick={goToAdmin}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Settings size={18} />
                Admin Panel
              </button>
            </div>

            <div className="md:hidden">
              <button className="p-2 text-slate-600">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32 lg:pt-32 lg:pb-48">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Campus Background" 
            className="w-full h-full object-cover opacity-30 scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
              {!authLoading && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider mb-8">
                  <Zap size={14} className="text-primary-400" />
                  {authProfile ? `Welcome back, ${authProfile.name}` : 'Next-Generation Campus Management'}
                </div>
              )}
              
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl leading-tight">
                <span className="block">{overview?.title?.split(' ')[0] || 'Smart'}</span>
                <span className="block text-primary-500">{overview?.title?.split(' ').slice(1).join(' ') || 'Campus Operations Hub'}</span>
              </h1>
              <p className="mt-3 text-base text-slate-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl max-w-xl">
                {overview?.subtitle || 'A premium web interface to discover campus resources, review availability, and access operations dashboards.'}
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                <a 
                  href="#resources" 
                  className="px-8 py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:bg-primary-500 transition-all flex items-center justify-center gap-2 group"
                >
                  Browse Resources
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <button 
                  onClick={goToAdmin}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                >
                  Admin Access
                </button>
              </div>

              <div className="mt-12 flex items-center gap-8 opacity-60">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white">
                      {String.fromCharCode(64+i)}
                    </div>
                  ))}
                </div>
                <div className="text-slate-400 text-sm">
                  Trusted by <span className="text-white font-semibold">1,000+</span> students & faculty
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-5 hidden lg:block">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-colors"></div>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-primary-400" />
                  Quick Access Status
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase">Auth Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${authProfile ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {authProfile ? 'CONNECTED' : 'GUEST'}
                      </span>
                    </div>
                    <p className="text-white text-sm">
                      {authProfile 
                        ? `Session active for ${authProfile.email}`
                        : 'Sign in for full access to bookings'
                      }
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-xs font-semibold uppercase">Platform Role</span>
                      <span className="text-primary-400 text-xs font-bold">
                        {authProfile?.role || 'None'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {authProfile ? (
                        <button 
                          onClick={handleLogout}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate('/login')}
                          className="w-full py-2 bg-primary-500 text-white text-xs font-bold rounded-lg hover:bg-primary-400 transition-colors"
                        >
                          Sign In Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary-600 text-sm font-bold tracking-widest uppercase mb-3">System Highlights</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Designed for a clear first impression
            </h3>
            <p className="text-slate-500 text-lg">
              Our smart campus infrastructure provides students and staff with streamlined tools to manage the daily academic environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(overview?.features || [
              { title: 'Smart Resource Search', desc: 'Explore lecture halls, labs, meeting rooms, and equipment.' },
              { title: 'Fast Booking Workflow', desc: 'Submit and track requests with clear approval statuses.' },
              { title: 'Centralized Operations', desc: 'Bring bookings and admin reviews together in one system.' },
              { title: 'Premium UI Experience', desc: 'Designed for clear navigation, clean cards, and dashboards.' }
            ]).map((item, index) => (
              <div key={index} className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  {index === 0 && <Search size={24} />}
                  {index === 1 && <Calendar size={24} />}
                  {index === 2 && <Settings size={24} />}
                  {index === 3 && <Layers size={24} />}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-50 text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Catalogue */}
      <section id="resources" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-primary-600 text-sm font-bold tracking-widest uppercase mb-3">Catalogue Preview</h2>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Find available campus resources</h3>
              <p className="text-slate-500">Search lecture halls, labs, rooms, and equipment from one place seamlessly.</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Inactive</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-12">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Box className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="type"
                  placeholder="Resource Type"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                  value={filters.type}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  placeholder="Location / Building"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                  value={filters.location}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  name="minCapacity"
                  placeholder="Min Capacity"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                  value={filters.minCapacity}
                  onChange={handleChange}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Search Resources
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Fetching resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={32} />
              </div>
              <h4 className="text-slate-900 font-bold text-xl mb-2">No resources found</h4>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {resources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-500/10 hover:-translate-y-1 transition-all group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                        {resource.type}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                        String(resource.status).toLowerCase() === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${String(resource.status).toLowerCase() === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                        {resource.status}
                      </span>
                    </div>
                    
                    <h4 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">{resource.name}</h4>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 mb-6">
                      <MapPin size={14} />
                      {resource.location}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Capacity</div>
                        <div className="text-slate-900 font-bold flex items-center gap-1.5">
                          <Users size={14} className="text-primary-500" />
                          {resource.capacity}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Available</div>
                        <div className="text-slate-900 font-bold text-xs truncate">
                          {resource.availabilityWindow}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={goToUserDashboard}
                      className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                    >
                      Book Now
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              SC
            </div>
            <span className="text-lg font-bold text-slate-900">SmartCampus</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 Smart Campus Operations. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}