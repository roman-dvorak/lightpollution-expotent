import { useTranslation } from 'react-i18next'
import CityGame from './components/CityGame'
import './i18n'

export default function App() {
  const { i18n } = useTranslation()

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'cs' ? 'en' : 'cs')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14]">
      <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-[#0a0a14]/90 backdrop-blur">
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
          <span className="text-2xl">🔭</span>
          <span className="text-white font-semibold text-sm hidden sm:block">Rozviť město, zhasni oblohu</span>
        </div>

        <div className="flex-1" />

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
    </div>
  )
}
