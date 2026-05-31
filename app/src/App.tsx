import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Introduction from './components/Introduction'
import CityGame from './components/CityGame'
import GlobeView from './components/GlobeView'
import './i18n'

type Tab = 'intro' | 'city' | 'globe'

export default function App() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('intro')

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'cs' ? 'en' : 'cs')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'intro', label: t('nav.intro') },
    { id: 'city',  label: t('nav.city') },
    { id: 'globe', label: t('nav.globe') },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14]">
      <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-[#0a0a14]/90 backdrop-blur">
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
          <span className="text-2xl">🔭</span>
          <span className="text-white font-semibold text-sm hidden sm:block">Stellarium Kiosk</span>
        </div>

        <nav className="flex gap-1 flex-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={toggleLang}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition-all font-medium"
        >
          {i18n.language === 'cs' ? 'EN' : 'CS'}
        </button>
      </header>

      <main className="flex-1">
        {tab === 'intro' && <Introduction />}
        {tab === 'city'  && <CityGame />}
        {tab === 'globe' && <GlobeView />}
      </main>
    </div>
  )
}
