import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'

export default function App() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <Toolbar />
      <main className="flex flex-1 overflow-hidden">
        <Editor />
        <Preview />
      </main>
    </div>
  )
}
