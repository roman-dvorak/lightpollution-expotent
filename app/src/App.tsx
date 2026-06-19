import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CityGame from './components/CityGame'
import { resetToIntro } from './services/stellarium'
import asuLogo from './assets/asu-logo.png'
import casLogo from './assets/cas-logo.png'
import './i18n'

export default function App() {
  const { t, i18n } = useTranslation()
  const [showAbout, setShowAbout] = useState(false)

  function handleTitleClick() {
    resetToIntro()
      .then(() => console.debug('sky centered'))
      .catch(() => {})
  }

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'cs' ? 'en' : 'cs')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14]">
      <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-[#0a0a14]/90 backdrop-blur">
        <div className="flex items-center gap-2 mr-4 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleTitleClick} title="Vycentrovat oblohu">
          <span className="text-2xl">🔭</span>
          <span className="text-white font-semibold text-sm hidden sm:block">Rozviť město, zhasni oblohu</span>
        </div>

        <div className="flex-1" />

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

      <main className="flex-1">
        <CityGame />
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
