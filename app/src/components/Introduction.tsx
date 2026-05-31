import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyState, bortleToLP, resetToIntro } from '../services/stellarium'

// ─── Content data ─────────────────────────────────────────────────────────────

type Lang = { title: string; short: string; long: string }
type Topic = { id: string; icon: string; cs: Lang; en: Lang }

const TOPICS: Topic[][] = [
  // Column 1 — Příčiny / Causes
  [
    {
      id: 'skyglow', icon: '🌃',
      cs: {
        title: 'Záře noční oblohy',
        short: 'Světlo rozptýlené v atmosféře rozsvěcuje oblohu nad osídlenými oblastmi.',
        long: 'Záře noční oblohy (skyglow) vzniká, když světlo ze svítidel dopadá na atmosférické molekuly a částice, které ho odrážejí zpět k zemi. Obloha nad velkými městy je tak až 10× jasnější než přirozená noční obloha.\n\nMléčnou dráhu dnes nemůže spatřit přibližně třetina světové populace. V Evropě ji neuvidí asi 60 % obyvatel — včetně většiny Čechů žijících v aglomeracích.\n\nZáře oblohy přitom světlí i desítky kilometrů daleko od zástavby. Snímky ze satelitů ukazují, jak se světelné záplavy měst slévají v celé světelné koberece.',
      },
      en: {
        title: 'Skyglow',
        short: 'Light scattered in the atmosphere brightens the sky above populated areas.',
        long: 'Skyglow occurs when artificial light reflects off atmospheric molecules and particles back toward the ground. The sky above large cities can be up to 10× brighter than a natural night sky.\n\nAbout one third of the world\'s population can no longer see the Milky Way. In Europe, roughly 60% of inhabitants live under skies too bright to see it.\n\nSkyglow spreads tens of kilometres beyond city limits. Satellite imagery shows how light domes from individual cities merge into vast glowing sheets across entire continents.',
      },
    },
    {
      id: 'energy', icon: '⚡',
      cs: {
        title: 'Plýtvání energií',
        short: 'Třetina veškerého venkovního osvětlení vyzáří světlo přímo do oblohy — bez užitku.',
        long: 'Svítidla bez clony nebo nasměrovaná špatně posílají světlo do nebe místo na plochy, které mají osvětlovat. V USA se tím ztratí přes 22 TWh ročně — dost energie pro 2 miliony domácností.\n\nCelosvětově jde o miliardy dolarů ročně. Přitom přechod na svítidla s plnou clonou snižuje světelné znečištění o 50–90 % při zachování stejné úrovně osvětlení vozovek a chodníků.\n\nSprávně navržené osvětlení šetří energii, peníze a přitom svítí stejně dobře.',
      },
      en: {
        title: 'Energy waste',
        short: 'A third of all outdoor lighting shines directly into the sky — uselessly.',
        long: 'Fixtures without shields or poorly aimed send light into the sky instead of onto surfaces that need illuminating. The US alone wastes over 22 TWh per year this way — enough to power 2 million homes.\n\nGlobally this represents billions of dollars annually. Switching to full-cutoff fixtures can reduce light pollution by 50–90% while maintaining the same surface illuminance on roads and paths.\n\nWell-designed lighting saves energy and money while performing just as well.',
      },
    },
    {
      id: 'types', icon: '💡',
      cs: {
        title: 'Typy světelného znečištění',
        short: 'Znečištění má čtyři formy: záře oblohy, oslnění, záření do cizího prostoru a světelný nepořádek.',
        long: '• Záře oblohy (skyglow) — rozsvícení oblohy nad sídlišti\n• Oslnění (glare) — nadměrný jas způsobující vizuální nepohodlí a snížení bezpečnosti\n• Záření do cizího prostoru (light trespass) — světlo dopadající tam, kde není žádoucí, např. do oken domů\n• Světelný nepořádek (clutter) — nadměrné množství světelných zdrojů různých barev a intenzit\n\nKaždá forma má jiné dopady na životní prostředí, zdraví a bezpečnost a vyžaduje jiná konstrukční řešení.',
      },
      en: {
        title: 'Types of light pollution',
        short: 'LP has four forms: skyglow, glare, light trespass, and clutter.',
        long: '• Skyglow — brightening of the sky over inhabited areas\n• Glare — excessive brightness causing visual discomfort and reduced safety\n• Light trespass — light falling where it is not needed, e.g. into bedroom windows\n• Clutter — excessive groups of lights of varying colours and intensities\n\nEach form has different impacts on environment, health and safety, and requires different engineering solutions.',
      },
    },
  ],
  // Column 2 — Dopady / Effects
  [
    {
      id: 'wildlife', icon: '🦅',
      cs: {
        title: 'Živočichové a příroda',
        short: 'Umělé světlo dezorientuje ptáky, láká hmyz a mate mořské želvičky.',
        long: 'Stěhovaví ptáci se orientují podle hvězd a přirozené polarity oblohy. Záře měst je přitahuje a způsobuje dezorientaci — odhaduje se, že v USA ročně naráží do budov přes miliardu ptáků.\n\nHmyz přitahovaný světly tráví zbytečně energii, stává se snadnou kořistí a jeho úbytek narušuje celé potravinové řetězce včetně opylování rostlin.\n\nMořské želvičky vylézají z vajíček a přirozeně míří ke světlejšímu horizontu — k moři. Osvětlené pláže je lákají opačným směrem, daleko od vody, kde zahynou.',
      },
      en: {
        title: 'Wildlife and nature',
        short: 'Artificial light disorients birds, lures insects, and confuses sea turtle hatchlings.',
        long: 'Migratory birds navigate by stars and natural sky polarity. City glow attracts them and causes disorientation — over a billion birds collide with buildings each year in the US alone.\n\nInsects drawn to lights waste energy, become easy prey, and their decline disrupts entire food chains including plant pollination.\n\nSea turtle hatchlings emerge from eggs and naturally head toward the brighter horizon — the sea. Lit beaches draw them inland instead, where they die.',
      },
    },
    {
      id: 'health', icon: '🧬',
      cs: {
        title: 'Lidské zdraví',
        short: 'Světlo v noci potlačuje melatonin a narušuje spánek, s dlouhodobými zdravotními dopady.',
        long: 'Lidský organismus se vyvíjel v cyklu přirozené denní a noční oblohy. Modrá složka umělého světla (především z LED) potlačuje produkci melatoninu — hormonu regulujícího spánek a imunitu.\n\nChronické narušení spánku zvyšuje riziko obezity, cukrovky 2. typu, kardiovaskulárních onemocnění a depresí. Epidemiologické studie opakovaně nacházejí korelaci mezi světelným znečištěním v místě bydliště a vyšší incidencí rakoviny prsu a prostaty.\n\nSvětelné znečištění nepostihuje jen astronomy — doléhá na všechny nás každou noc.',
      },
      en: {
        title: 'Human health',
        short: 'Light at night suppresses melatonin and disrupts sleep, with long-term health consequences.',
        long: 'The human body evolved with a natural day-night cycle. The blue component of artificial light — especially from LEDs — suppresses melatonin production, the hormone that regulates sleep and immunity.\n\nChronic sleep disruption raises the risk of obesity, type 2 diabetes, cardiovascular disease and depression. Epidemiological studies repeatedly find correlations between residential light pollution and higher rates of breast and prostate cancer.\n\nLight pollution doesn\'t only affect astronomers — it affects all of us every night.',
      },
    },
    {
      id: 'astronomy', icon: '🔭',
      cs: {
        title: 'Astronomie',
        short: 'Dvě třetiny Evropanů nikdy nespatřily Mléčnou dráhu. Observatoře ustupují stále dál.',
        long: 'Astronomie je jediná přírodní věda, kde velká část historicky dostupných pozorování je pro moderní profesionální výzkum prakticky nedostupná. Observatoře jsou vytlačovány do stále odlehlejších lokalit — mnohdy na jiné kontinenty.\n\nSvětelné znečištění zkracuje efektivní observační čas, snižuje dosah přístrojů a zdražuje výzkum. Amatérská astronomie — tradičně základ popularizace vědy — se stává dostupnou jen pro ty, kdo mohou cestovat desítky kilometrů za město.\n\nZároveň hrozí, že celé generace vyrostou, aniž by kdy viděly hvězdnou oblohu takovou, jaká je.',
      },
      en: {
        title: 'Astronomy',
        short: 'Two thirds of Europeans have never seen the Milky Way. Observatories keep moving further away.',
        long: 'Astronomy is the only natural science where much of what was once routinely observable is now practically inaccessible to modern professional research. Observatories are pushed to ever more remote locations — often to other continents.\n\nLight pollution shortens effective observing time, reduces instrument reach and makes research more expensive. Amateur astronomy — traditionally the foundation of science outreach — is becoming accessible only to those able to drive tens of kilometres from cities.\n\nWhole generations risk growing up never having seen a truly starry sky.',
      },
    },
  ],
  // Column 3 — Řešení / Solutions
  [
    {
      id: 'lighting', icon: '🔆',
      cs: {
        title: 'Správné osvětlení',
        short: 'Clona, teplá barva a stmívání — tři kroky ke snížení světelného znečištění.',
        long: 'Základní principy přátelského osvětlení:\n\n• Svítit dolů — svítidlo s plnou clonou (full-cutoff) nasměruje světlo pouze na plochu pod sebou a nevyzáří nic do nebe\n• Svítit jen tam, kde je třeba — pohybová čidla a časovače zamezí zbytečnému svícení\n• Svítit jen tolik, kolik je třeba — stmívání na nejnižší bezpečnou úroveň\n• Správná barva světla — teplé bílé nebo jantarové LED (pod 3 000 K) jsou méně škodlivé pro organismy a méně rozptyluje je atmosféra\n\nNáhrada stávajícího osvětlení za správně navržená LED svítidla snižuje světelné znečištění 3–5× bez jakéhokoli poklesu funkčnosti.',
      },
      en: {
        title: 'Good lighting',
        short: 'Shielding, warm colour and dimming — three steps to reducing light pollution.',
        long: 'Key principles of responsible lighting:\n\n• Shine downward — a full-cutoff fixture directs all light onto the surface below and emits nothing into the sky\n• Shine only where needed — motion sensors and timers prevent unnecessary illumination\n• Shine only as bright as needed — dimming to the minimum safe level\n• Right colour of light — warm white or amber LEDs (below 3,000 K) are less harmful to organisms and scatter less in the atmosphere\n\nReplacing existing fixtures with properly designed LED luminaires reduces light pollution 3–5× with no loss of functionality.',
      },
    },
    {
      id: 'darksky', icon: '🌌',
      cs: {
        title: 'Tmavá nebe',
        short: 'IDA certifikuje parky a rezervace, kde je noční obloha chráněna před znečištěním.',
        long: 'Mezinárodní asociace tmavé oblohy (IDA) uděluje certifikáty místům, která aktivně chrání noční oblohu prostřednictvím regulace osvětlení. Celosvětově existuje přes 200 certifikovaných lokalit.\n\nV Evropě patří k nejznámějším Brecon Beacons (Velká Británie), Exmoor, Gran Canaria nebo Abruzzo v Itálii. V České republice usiluje projekt Dark Sky Czech Republic o certifikaci Šumavy.\n\nNávštěvou takových míst nejen zažijete pohled na skutečně hvězdnou oblohu, ale přímo podpoříte zachování tmavé oblohy jako přírodního dědictví.',
      },
      en: {
        title: 'Dark sky places',
        short: 'IDA certifies parks and reserves where the night sky is protected from light pollution.',
        long: 'The International Dark-Sky Association (IDA) awards certifications to places that actively protect the night sky through lighting regulations. More than 200 certified sites exist worldwide.\n\nIn Europe the most prominent include Brecon Beacons (UK), Exmoor, Gran Canaria and Abruzzo in Italy. In the Czech Republic, the Dark Sky Czech Republic project is working toward certification of the Šumava region.\n\nVisiting these places gives you the experience of a truly starry sky while directly supporting the preservation of darkness as a natural heritage.',
      },
    },
    {
      id: 'action', icon: '✅',
      cs: {
        title: 'Co mohu udělat?',
        short: 'Každý může přispět — správnou lampou, zatemněnou žaluzií nebo zapojením sousedů.',
        long: 'Doma:\n• Venkovní svítidla nahraďte typy s plnou clonou a teplou barvou světla\n• Zatemněte okna, aby světlo nevnikalo ven a nenarušovalo noční prostředí okolí\n\nVe škole nebo v práci:\n• Navrhněte přechod na stmívatelné osvětlení s pohybovými čidly\n\nV obci:\n• Oslovte zastupitele s žádostí o revizi veřejného osvětlení\n• Zapojte se do projektu Globe at Night — měření kvality oblohy z vaší zahrady\n\nOsvěta:\n• Přiveďte děti na Noc s dalekohledem nebo do hvězdárny\n• Sdílejte informace o světelném znečištění se sousedy a přáteli',
      },
      en: {
        title: 'What can I do?',
        short: 'Everyone can help — with the right lamp, a good blind, or by getting neighbours involved.',
        long: 'At home:\n• Replace outdoor fixtures with full-cutoff, warm-toned units\n• Use blackout blinds to prevent indoor light from spilling outside\n\nAt school or work:\n• Propose switching to dimmable lighting with motion sensors\n\nIn your community:\n• Contact local officials and request a review of public street lighting\n• Join Globe at Night — measuring sky quality from your own garden\n\nAwareness:\n• Bring children to a star party or planetarium\n• Share information about light pollution with neighbours and friends',
      },
    },
  ],
]

const BORTLE_CLASSES = [
  { cls: 1, color: '#000033' },
  { cls: 2, color: '#001a4d' },
  { cls: 3, color: '#003066' },
  { cls: 4, color: '#1a4d80' },
  { cls: 5, color: '#336699' },
  { cls: 6, color: '#4d7f99' },
  { cls: 7, color: '#7a9e7e' },
  { cls: 8, color: '#c4a35a' },
  { cls: 9, color: '#d4812c' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Introduction() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'cs' ? 'cs' : 'en'
  const [modal,  setModal]  = useState<Topic | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    resetToIntro().catch(err => console.warn('resetToIntro failed', err))
  }, [])

  async function handleBortle(cls: number) {
    setStatus(t('stel.sending'))
    try {
      await applyState({ lat: 50.08, lon: 14.42, lightPollution: bortleToLP(cls) })
      setStatus(null)
    } catch {
      setStatus(t('stel.error'))
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 53px)' }}>

      {/* ── Title row ── */}
      <div className="flex-shrink-0 px-8 pt-6 pb-3">
        <h1 className="text-3xl font-bold text-white">{t('intro.title')}</h1>
        <p className="text-slate-400 mt-1">{t('intro.subtitle')}</p>
      </div>

      {/* ── 3-column topic grid ── */}
      <div className="flex-1 grid grid-cols-3 gap-4 px-8 pb-4 min-h-0">
        {TOPICS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-4">
            {col.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                lang={lang}
                onOpen={() => setModal(topic)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Bortle strip ── */}
      <div className="flex-shrink-0 px-8 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-slate-400 text-sm">{t('intro.bortle')}</span>
          <span className="text-slate-600 text-xs">{t('intro.bortleDesc')}</span>
        </div>
        <div className="flex gap-1.5">
          {BORTLE_CLASSES.map(({ cls, color }) => (
            <button
              key={cls}
              onClick={() => handleBortle(cls)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-all hover:scale-105 active:scale-95"
              style={{ background: `${color}30` }}
            >
              <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: color }} />
              <span className="text-white text-xs font-bold">B{cls}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Info modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModal(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl border border-slate-600 p-8 overflow-y-auto"
            style={{ background: '#0d0d1e', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-lg leading-none transition-colors"
            >
              ×
            </button>
            <div className="text-4xl mb-3">{modal.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-4">{modal[lang].title}</h2>
            <div className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
              {modal[lang].long}
            </div>
          </div>
        </div>
      )}

      {/* ── Status toast ── */}
      {status && (
        <div className="fixed bottom-6 right-6 bg-slate-700/90 backdrop-blur text-white px-5 py-3 rounded-xl shadow-xl text-sm border border-slate-600">
          {status}
        </div>
      )}
    </div>
  )
}

// ─── TopicCard ─────────────────────────────────────────────────────────────────

function TopicCard({ topic, lang, onOpen }: { topic: Topic; lang: 'cs' | 'en'; onOpen: () => void }) {
  const content = topic[lang]
  return (
    <div className="relative flex-1 rounded-2xl border border-slate-700 bg-slate-800/40 p-5 flex flex-col gap-2 min-h-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{topic.icon}</span>
          <h3 className="text-white font-semibold leading-tight">{content.title}</h3>
        </div>
        <button
          onClick={onOpen}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 hover:bg-blue-700 text-slate-300 hover:text-white text-sm font-bold transition-colors flex items-center justify-center"
          title="Více informací"
        >
          ?
        </button>
      </div>
      <p className="text-slate-400 text-sm leading-snug">{content.short}</p>
    </div>
  )
}
