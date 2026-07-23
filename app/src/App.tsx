import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Introduction from './components/Introduction'
import CityGame from './components/CityGame'
import GlobeView from './components/GlobeView'
import { resetToIntro, detectSkyMode, type SkyMode } from './services/skyService'
import asuLogo from './assets/asu-logo.png'
import casLogo from './assets/cas-logo.png'
import './i18n'

type Tab = 'intro' | 'city' | 'globe'

export default function App() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('intro')
  const [showAbout, setShowAbout] = useState(false)
  const [skyMode, setSkyMode] = useState<SkyMode | null>(null)

  useEffect(() => {
    detectSkyMode().then(setSkyMode).catch(() => setSkyMode('fallback'))
  }, [])

  function handleTitleClick() {
    resetToIntro()
      .then(() => console.debug('sky centered'))
      .catch(() => {})
  }

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'cs' ? 'en' : 'cs')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'intro', label: t('nav.intro') },
    { id: 'city', label: t('nav.city') },
    { id: 'globe', label: t('nav.globe') },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14]">
      <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-[#0a0a14]/90 backdrop-blur">
        <div className="flex items-center gap-2 mr-4 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleTitleClick} title="Vycentrovat oblohu">
          <span className="text-2xl">🔭</span>
          <span className="text-white font-semibold text-sm hidden sm:block">Rozviť město, zhasni oblohu</span>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-blue-900/60 text-blue-100 border border-blue-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {skyMode && (
          <span
            className={`hidden md:inline-flex text-xs px-2 py-1 rounded-full border ${
              skyMode === 'stellarium'
                ? 'border-green-800 text-green-400 bg-green-900/20'
                : 'border-slate-700 text-slate-500 bg-slate-900/40'
            }`}
            title={skyMode === 'stellarium' ? 'Planetárium' : 'Web režim'}
          >
            {skyMode === 'stellarium' ? 'Stellarium' : 'Web'}
          </span>
        )}

        <button
          onClick={() => setShowAbout(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition-all font-medium"
        >
          {t('about.button')}
        </button>

        <button
          onClick={toggleLang}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition-all font-medium"
        >
          {i18n.language === 'cs' ? 'EN' : 'CS'}
        </button>
      </header>

      {/* Mobile tab selector */}
      <div className="sm:hidden flex border-b border-slate-800 bg-[#0a0a14]/90">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === id ? 'text-blue-300 border-b-2 border-blue-500' : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1">
        {tab === 'intro' && <Introduction />}
        {tab === 'city' && <CityGame />}
        {tab === 'globe' && <GlobeView />}
      </main>

      {/* About modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowAbout(false)}
        >
          <div
            className="relative max-w-xl w-full rounded-2xl border border-slate-600 p-8 overflow-y-auto"
            style={{ background: '#0d0d1e', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-lg leading-none transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">{t('about.title')}</h2>
            <div className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
              {t('about.body')}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-center gap-6">
              <img src={asuLogo} alt="Astronomický ústav AV ČR" className="h-24 opacity-80 hover:opacity-100 transition-opacity" />
              <img src={casLogo} alt="Česká astronomická společnost" className="h-24 opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
