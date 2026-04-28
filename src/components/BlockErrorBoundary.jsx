import { Component } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

export default class BlockErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') {
      console.error('[BlockErrorBoundary]', this.props.label || 'block', error, info)
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const t = this.props.t || {}
    const onDelete = this.props.onDelete
    const variant = this.props.variant || 'editor'
    const message = error?.message || t.unknown || 'Unknown error'

    if (variant === 'preview') {
      return (
        <div
          role="alert"
          className="my-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{t.previewTitle || 'Failed to render block'}</span>
          </div>
          <p className="mt-1 text-xs text-red-700/80">{message}</p>
        </div>
      )
    }

    return (
      <div
        role="alert"
        className="my-2 flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{t.editorTitle || 'This block crashed'}</span>
        </div>
        <p className="text-xs text-red-700/80">{message}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded border border-red-300 bg-white px-2 py-1 text-xs hover:bg-red-100"
          >
            {t.retry || 'Retry'}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-100"
            >
              <Trash2 size={12} aria-hidden="true" />
              {t.deleteBlock || 'Delete block'}
            </button>
          )}
        </div>
      </div>
    )
  }
}
