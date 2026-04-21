import { useEffect } from 'react'
import HubBar from './components/HubBar'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import ReportLibrary from './components/ReportLibrary'
import { useReportStore } from './store/reportStore'
import { initHistoryTracking } from './store/historyStore'

export default function App() {
  useEffect(() => initHistoryTracking(), [])
  const view = useReportStore((s) => s.view)

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <HubBar />
      {view === 'library' ? (
        <ReportLibrary />
      ) : (
        <>
          <Toolbar />
          <main className="flex flex-1 overflow-hidden">
            <Editor />
            <Preview />
          </main>
        </>
      )}
    </div>
  )
}
