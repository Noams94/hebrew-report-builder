import { useEffect } from 'react'
import HubBar from './components/HubBar'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import ReportLibrary from './components/ReportLibrary'
import { useReportStore } from './store/reportStore'
import { initHistoryTracking } from './store/historyStore'
import { useLang, useDir, useT } from './i18n'

export default function App() {
  useEffect(() => initHistoryTracking(), [])
  const view = useReportStore((s) => s.view)
  const lang = useLang()
  const dir = useDir()
  const t = useT()

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', lang)
    root.setAttribute('dir', dir)
    document.title = t.app.name
  }, [lang, dir, t])

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <a href="#main" className="skip-link">
        {t.a11y.skipToMain}
      </a>
      <HubBar />
      {view === 'library' ? (
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col overflow-hidden">
          <ReportLibrary />
        </main>
      ) : (
        <>
          <Toolbar />
          <main id="main" tabIndex={-1} className="flex flex-1 overflow-hidden">
            <Editor />
            <Preview />
          </main>
        </>
      )}
    </div>
  )
}
