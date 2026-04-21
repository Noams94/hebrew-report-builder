import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const LOW = [240, 245, 250]
const HIGH = [30, 58, 95]

function interpolate(t) {
  const lerp = (a, b, t) => Math.round(a + (b - a) * t)
  return `rgb(${lerp(LOW[0], HIGH[0], t)}, ${lerp(LOW[1], HIGH[1], t)}, ${lerp(LOW[2], HIGH[2], t)})`
}

export default function MapPreview({ data }) {
  const {
    title = '',
    points = [],
    center = [31.5, 34.8],
    zoom = 8,
    colorByValue = false,
  } = data

  const { minV, maxV } = useMemo(() => {
    const vals = points
      .map((p) => Number(p.value))
      .filter((v) => Number.isFinite(v))
    if (vals.length === 0) return { minV: 0, maxV: 0 }
    return { minV: Math.min(...vals), maxV: Math.max(...vals) }
  }, [points])
  const range = maxV - minV || 1

  if (points.length === 0) {
    return (
      <div className="my-4 rounded border border-dashed border-subtle p-4 text-sm text-ink/40">
        [בלוק מפה — הוסף נקודות בעורך]
      </div>
    )
  }

  return (
    <div className="my-5">
      {title && (
        <div className="mb-2 text-center font-serif text-lg font-semibold">
          {title}
        </div>
      )}
      <div className="h-80 overflow-hidden rounded-lg border border-subtle">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
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
                  <div style={{ direction: 'rtl', textAlign: 'right' }}>
                    <strong>{p.label || 'נקודה'}</strong>
                    {hasVal && <div>ערך: {p.value}</div>}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
