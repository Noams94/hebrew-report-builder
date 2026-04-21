import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Upload, Trash2, Plus, Map as MapIcon, Crosshair } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'
import { useLang, isRtl } from '../../i18n'

const DEFAULT_CENTER = [31.5, 34.8]
const DEFAULT_ZOOM = 8
const LOW = [240, 245, 250]
const HIGH = [30, 58, 95]

const EXTRA = {
  he: {
    title: 'מפה אינטראקטיבית',
    colorByValue: 'צבוע לפי ערך',
    clickToAdd: 'לחיצה להוספת נקודה',
    importExcel: 'ייבוא Excel',
    importHint: '(עמודות: label/lat/lng/value)',
    titlePh: 'כותרת המפה',
    label: 'תווית',
    value: 'ערך',
    remove: 'מחק',
    empty: 'אין נקודות. הוסף ידנית, ייבא מ-Excel, או סמן "לחיצה להוספה" ולחץ על המפה.',
    noColumns: 'לא נמצאו עמודות lat/lng בקובץ',
    labelPh: 'תווית',
    valuePh: 'ערך',
    add: 'הוסף',
    current: 'מיקום נוכחי:',
    point: 'נקודה',
  },
  en: {
    title: 'Interactive map',
    colorByValue: 'Color by value',
    clickToAdd: 'Click to add point',
    importExcel: 'Import Excel',
    importHint: '(columns: label/lat/lng/value)',
    titlePh: 'Map title',
    label: 'Label',
    value: 'Value',
    remove: 'Delete',
    empty: 'No points. Add manually, import Excel, or enable "click to add" and click the map.',
    noColumns: 'No lat/lng columns found in file',
    labelPh: 'Label',
    valuePh: 'Value',
    add: 'Add',
    current: 'Current view:',
    point: 'Point',
  },
}

function interpolate(t) {
  const lerp = (a, b, t) => Math.round(a + (b - a) * t)
  return `rgb(${lerp(LOW[0], HIGH[0], t)}, ${lerp(LOW[1], HIGH[1], t)}, ${lerp(LOW[2], HIGH[2], t)})`
}

function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function ViewportSync({ onChange }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onChange([c.lat, c.lng], e.target.getZoom())
    },
    zoomend(e) {
      const c = e.target.getCenter()
      onChange([c.lat, c.lng], e.target.getZoom())
    },
  })
  return null
}

function FitOnce({ points }) {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || points.length <= 1) return
    didFit.current = true
    const bounds = points.map((p) => [p.lat, p.lng])
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [map, points])
  return null
}

export default function MapBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const lang = useLang()
  const L = EXTRA[lang] || EXTRA.he
  const rtl = isRtl(lang)
  const fileInputRef = useRef(null)
  const {
    title = '',
    points = [],
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    colorByValue = false,
    clickToAdd = false,
  } = block.data

  const [draft, setDraft] = useState({ label: '', lat: '', lng: '', value: '' })

  const { minV, maxV } = useMemo(() => {
    const vals = points
      .map((p) => Number(p.value))
      .filter((v) => Number.isFinite(v))
    if (vals.length === 0) return { minV: 0, maxV: 0 }
    return { minV: Math.min(...vals), maxV: Math.max(...vals) }
  }, [points])

  const range = maxV - minV || 1

  const addPoint = (lat, lng, label = '', value = '') => {
    const point = {
      id: crypto.randomUUID(),
      lat: Number(lat),
      lng: Number(lng),
      label: String(label || ''),
      value: value === '' ? null : Number(value),
    }
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return
    updateBlock(block.id, { points: [...points, point] })
  }

  const removePoint = (id) => {
    updateBlock(block.id, { points: points.filter((p) => p.id !== id) })
  }

  const handleAddDraft = () => {
    addPoint(draft.lat, draft.lng, draft.label, draft.value)
    setDraft({ label: '', lat: '', lng: '', value: '' })
  }

  const handleExcel = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await parseExcel(file)
    const sheet = result.data[result.sheets[0]]
    if (!sheet) return
    const headers = sheet.headers.map((h) => h.toLowerCase())
    const latIdx = headers.findIndex((h) =>
      /lat|latitude|קו.?רוחב/i.test(h),
    )
    const lngIdx = headers.findIndex((h) =>
      /lng|lon|longitude|קו.?אורך/i.test(h),
    )
    const labelIdx = headers.findIndex((h) =>
      /label|name|title|שם|כותרת/i.test(h),
    )
    const valueIdx = headers.findIndex((h) =>
      /value|score|ערך|ציון/i.test(h),
    )
    if (latIdx === -1 || lngIdx === -1) {
      alert(L.noColumns)
      return
    }
    const newPoints = sheet.rows
      .map((r) => ({
        id: crypto.randomUUID(),
        lat: Number(r[latIdx]),
        lng: Number(r[lngIdx]),
        label: labelIdx !== -1 ? String(r[labelIdx] || '') : '',
        value: valueIdx !== -1 && r[valueIdx] !== '' ? Number(r[valueIdx]) : null,
      }))
      .filter(
        (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
      )
    updateBlock(block.id, { points: [...points, ...newPoints] })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        <MapIcon size={14} className="text-ink/50" />
        <span className="font-medium">{L.title}</span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={colorByValue}
            onChange={(e) =>
              updateBlock(block.id, { colorByValue: e.target.checked })
            }
          />
          {L.colorByValue}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={clickToAdd}
            onChange={(e) =>
              updateBlock(block.id, { clickToAdd: e.target.checked })
            }
          />
          {L.clickToAdd}
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded border border-subtle px-2 py-1 hover:bg-paper"
        >
          <Upload size={12} />
          {L.importExcel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcel}
          className="hidden"
        />
        <span className="text-ink/50">{L.importHint}</span>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
        placeholder={L.titlePh}
        className="rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
      />

      <div className="h-80 overflow-hidden rounded-lg border border-subtle">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ViewportSync
            onChange={(c, z) => updateBlock(block.id, { center: c, zoom: z })}
          />
          {clickToAdd && <ClickToAdd onAdd={addPoint} />}
          <FitOnce points={points} />
          {points.map((p) => {
            const hasVal = p.value !== null && p.value !== undefined
            const t = hasVal ? (p.value - minV) / range : 0
            const fill =
              colorByValue && hasVal ? interpolate(t) : '#0f766e'
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={8}
                pathOptions={{
                  fillColor: fill,
                  color: '#111827',
                  weight: 1,
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div
                    style={{
                      direction: rtl ? 'rtl' : 'ltr',
                      textAlign: rtl ? 'right' : 'left',
                    }}
                  >
                    <strong>{p.label || L.point}</strong>
                    {hasVal && (
                      <div>
                        {L.value}: {p.value}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      <div className="rounded-lg border border-subtle bg-white">
        <div className="grid grid-cols-[1fr_80px_80px_70px_40px] gap-2 border-b border-subtle bg-paper/60 p-2 text-xs font-medium">
          <span>{L.label}</span>
          <span>lat</span>
          <span>lng</span>
          <span>{L.value}</span>
          <span></span>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {points.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_80px_80px_70px_40px] items-center gap-2 border-b border-subtle p-1 text-xs"
            >
              <span className="truncate px-1">{p.label || '—'}</span>
              <span className="font-mono text-ink/70">{p.lat.toFixed(4)}</span>
              <span className="font-mono text-ink/70">{p.lng.toFixed(4)}</span>
              <span className="font-mono text-ink/70">
                {p.value === null || p.value === undefined ? '—' : p.value}
              </span>
              <button
                type="button"
                onClick={() => removePoint(p.id)}
                aria-label={L.remove}
                className="rounded p-1 text-ink/40 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {points.length === 0 && (
            <div className="p-3 text-center text-xs text-ink/40">{L.empty}</div>
          )}
        </div>
        <div className="grid grid-cols-[1fr_80px_80px_70px_40px] items-center gap-2 border-t border-subtle p-2 text-xs">
          <input
            type="text"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder={L.labelPh}
            className="rounded border border-subtle px-2 py-1 focus:outline-none"
          />
          <input
            type="number"
            step="0.0001"
            value={draft.lat}
            onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
            placeholder="31.77"
            dir="ltr"
            className="rounded border border-subtle px-1 py-1 font-mono focus:outline-none"
          />
          <input
            type="number"
            step="0.0001"
            value={draft.lng}
            onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
            placeholder="35.23"
            dir="ltr"
            className="rounded border border-subtle px-1 py-1 font-mono focus:outline-none"
          />
          <input
            type="number"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            placeholder={L.valuePh}
            dir="ltr"
            className="rounded border border-subtle px-1 py-1 font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddDraft}
            disabled={!draft.lat || !draft.lng}
            aria-label={L.add}
            className="rounded border border-subtle p-1 text-accent hover:bg-paper disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink/50">
        <Crosshair size={12} />
        {L.current} {center[0].toFixed(3)}, {center[1].toFixed(3)} @ zoom {zoom}
      </div>
    </div>
  )
}
