import { parseMarkdown } from './markdown'
import { slugify } from './slugify'
import { computeStats, formatMetric, METRIC_LABELS } from './stats'

const escapeHTML = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildDocStyles = (theme = {}) => {
  const accent = theme.accentColor || '#1e3a5f'
  const headingFont = theme.headingFont || 'Frank Ruhl Libre'
  const bodyFont = theme.bodyFont || 'Heebo'
  return `
  * { box-sizing: border-box; }
  :root { --accent: ${accent}; }
  body {
    margin: 0;
    background: #faf9f6;
    color: #1a1a1a;
    font-family: '${bodyFont}', system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  .article {
    background: #fff;
    border-radius: 12px;
    padding: 48px 56px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .toc {
    background: #fff;
    border: 1px solid #e7e5e0;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 24px;
    font-size: 14px;
  }
  .toc h2 { font-size: 15px; margin: 0 0 8px; font-family: '${headingFont}', serif; }
  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li { margin: 4px 0; }
  .toc a { color: #444; text-decoration: none; }
  .toc a:hover { color: var(--accent); text-decoration: underline; }
  @media (min-width: 1280px) {
    .container.with-toc {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 24px;
      max-width: 1200px;
      align-items: start;
    }
    .container.with-toc .toc {
      position: sticky;
      top: 24px;
      margin-bottom: 0;
    }
  }
  .report-logo { max-height: 64px; width: auto; margin-bottom: 16px; }
  .report-title {
    font-family: '${headingFont}', serif;
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--accent);
  }
  h1, h2, h3 {
    font-family: '${headingFont}', serif;
    color: #1a1a1a;
    line-height: 1.3;
  }
  h1 { font-size: 32px; margin: 32px 0 12px; }
  h2 { font-size: 26px; margin: 28px 0 10px; }
  h3 { font-size: 22px; margin: 24px 0 8px; }
  p { margin: 12px 0; }
  strong { font-weight: 600; }
  a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  ul { margin: 8px 0; padding-inline-start: 24px; }
  li { margin: 4px 0; }
  hr { border: 0; border-top: 1px solid #e7e5e0; margin: 32px 0; }
  figure { margin: 24px 0; text-align: center; }
  figure img { max-width: 100%; max-height: 520px; border-radius: 6px; }
  figcaption { font-size: 14px; color: #666; font-style: italic; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 15px; }
  th, td { padding: 10px 12px; text-align: right; }
  th { background: #faf9f6; border-bottom: 2px solid var(--accent); font-weight: 600; }
  td { border-bottom: 1px solid #e7e5e0; }
  .chart-wrapper { margin: 24px 0; }
  .chart-title { text-align: center; font-family: 'Frank Ruhl Libre', serif; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 20px 0; padding: 16px; border: 1px solid #e7e5e0; border-radius: 8px; background: #fff; }
  .stats-cell { display: flex; flex-direction: column; align-items: center; padding: 10px; background: #faf9f6; border-radius: 6px; }
  .stats-label { font-size: 12px; color: #666; }
  .stats-value { font-family: 'Frank Ruhl Libre', serif; font-size: 28px; font-weight: 700; }
  .map-wrapper { margin: 24px 0; }
  .map-wrapper .map-container { height: 400px; border-radius: 8px; border: 1px solid #e7e5e0; }
  @media print { .leaflet-control-attribution { font-size: 9px; } }
  @media print {
    body { background: #fff; }
    .toc { display: none; }
    .container { display: block; padding: 0; max-width: 100%; }
    .article { box-shadow: none; padding: 20px; }
    .chart-wrapper, figure, table { page-break-inside: avoid; }
    h1, h2, h3 { page-break-after: avoid; }
  }
`
}

const CHART_COLORS = [
  '#1e3a5f',
  '#7c2d12',
  '#556b2f',
  '#b45309',
  '#4b5563',
  '#0f766e',
]

const renderChart = (block) => {
  const { source, sheet, xColumn, yColumns, title, chartType, importedSvg } =
    block.data
  const titleHTML = title
    ? `<div class="chart-title">${escapeHTML(title)}</div>`
    : ''
  if (chartType === 'imported' && importedSvg) {
    return `<div class="chart-wrapper">${titleHTML}<div style="text-align:center;max-width:760px;margin:0 auto;">${importedSvg}</div></div>`
  }
  if (!source || !sheet || !xColumn || !yColumns?.length) return ''
  const sheetData = source.data[sheet]
  if (!sheetData) return ''
  const xIdx = sheetData.headers.indexOf(xColumn)
  if (xIdx === -1) return ''
  const labels = sheetData.rows.map((r) => String(r[xIdx] ?? ''))
  const datasets = yColumns.map((col, i) => {
    const cIdx = sheetData.headers.indexOf(col)
    const data = sheetData.rows.map((r) => {
      const n = Number(r[cIdx])
      return Number.isFinite(n) ? n : 0
    })
    return { label: col, data, color: CHART_COLORS[i % CHART_COLORS.length] }
  })
  const payload = JSON.stringify({
    kind: chartType,
    labels,
    datasets,
  }).replace(/'/g, '&#39;')
  return `<div class="chart-wrapper">${titleHTML}<div class="chart-canvas-wrapper" style="position:relative;max-width:760px;margin:0 auto;height:320px;"><canvas data-hrb-chart='${payload}'></canvas></div></div>`
}

const LIKERT_LABELS_5 = [
  'לא מסכים בכלל',
  'לא מסכים',
  'ניטרלי',
  'מסכים',
  'מסכים בהחלט',
]
const LIKERT_LABELS_7 = [
  'לא מסכים בכלל',
  'לא מסכים',
  'די לא מסכים',
  'ניטרלי',
  'די מסכים',
  'מסכים',
  'מסכים בהחלט',
]
const LIKERT_COLORS_5 = [
  '#b91c1c',
  '#f87171',
  '#9ca3af',
  '#4ade80',
  '#15803d',
]
const LIKERT_COLORS_7 = [
  '#7f1d1d',
  '#b91c1c',
  '#f87171',
  '#9ca3af',
  '#4ade80',
  '#15803d',
  '#14532d',
]

const renderLikert = (block) => {
  const { scale = 5, questions = [], title } = block.data
  const titleHTML = title
    ? `<div class="chart-title">${escapeHTML(title)}</div>`
    : ''
  const hasData = questions.some((q) => q.responses?.some((r) => r > 0))
  if (!hasData) return ''
  const labels = scale === 7 ? LIKERT_LABELS_7 : LIKERT_LABELS_5
  const colors = scale === 7 ? LIKERT_COLORS_7 : LIKERT_COLORS_5
  const questionLabels = questions.map(
    (q, i) => q.text || `שאלה ${i + 1}`,
  )
  const datasets = labels.map((label, i) => ({
    label,
    data: questions.map((q) => q.responses[i] ?? 0),
    color: colors[i],
  }))
  const payload = JSON.stringify({
    kind: 'likert',
    labels: questionLabels,
    datasets,
  }).replace(/'/g, '&#39;')
  const height = Math.max(200, questions.length * 50 + 80)
  return `<div class="chart-wrapper">${titleHTML}<div class="chart-canvas-wrapper" style="position:relative;max-width:760px;margin:0 auto;height:${height}px;"><canvas data-hrb-chart='${payload}'></canvas></div></div>`
}

const renderBlock = (block, context) => {
  const { headingIds = {}, reportTitle = '', theme = {} } = context || {}
  const { type, data, id } = block

  if (type === 'heading') {
    const { level = 2, text = '' } = data
    const tag = `h${level}`
    const anchorId = headingIds[id]
    return `<${tag} id="${anchorId}">${escapeHTML(text)}</${tag}>`
  }

  if (type === 'text') {
    return parseMarkdown(data.markdown ?? '')
  }

  if (type === 'image') {
    const { src, caption, alt } = data
    if (!src) return ''
    const altText = escapeHTML(alt || caption || 'תמונה בדוח')
    const captionHTML = caption
      ? `<figcaption>${escapeHTML(caption)}</figcaption>`
      : ''
    return `<figure><img src="${src}" alt="${altText}" />${captionHTML}</figure>`
  }

  if (type === 'table') {
    const { headers = [], rows = [] } = data
    if (headers.length === 0) return ''
    const thead = headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')
    const tbody = rows
      .map(
        (row) =>
          '<tr>' +
          headers
            .map((_, i) => `<td>${escapeHTML(row[i] ?? '')}</td>`)
            .join('') +
          '</tr>',
      )
      .join('')
    return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
  }

  if (type === 'chart') {
    return renderChart(block)
  }

  if (type === 'divider') {
    return '<hr />'
  }

  if (type === 'cover') {
    const {
      useReportTitle = true,
      overrideTitle = '',
      subtitle = '',
      client = '',
      date = '',
      logo,
      useThemeLogo = true,
    } = data
    const title = useReportTitle ? reportTitle : overrideTitle
    const coverLogo = useThemeLogo ? theme.logo : logo
    const accent = theme.accentColor || '#1e3a5f'
    const headingFont = theme.headingFont || 'Frank Ruhl Libre'
    const bodyFont = theme.bodyFont || 'Heebo'
    const logoHTML = coverLogo
      ? `<img src="${coverLogo}" alt="לוגו" style="max-height:96px;width:auto;margin-bottom:32px;object-fit:contain;" />`
      : ''
    return `<section class="cover-page" style="min-height:calc(100vh - 96px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;padding:40px 20px;">
      ${logoHTML}
      <h1 style="font-family:'${headingFont}',serif;font-size:48px;font-weight:700;color:${accent};margin:0 0 16px;">${escapeHTML(title || 'דוח')}</h1>
      ${subtitle ? `<div style="font-family:'${bodyFont}',sans-serif;font-size:20px;color:#4b5563;">${escapeHTML(subtitle)}</div>` : ''}
      <div style="margin-top:48px;display:flex;flex-direction:column;gap:4px;color:#6b7280;font-size:14px;">
        ${client ? `<div>${escapeHTML(client)}</div>` : ''}
        ${date ? `<div>${escapeHTML(date)}</div>` : ''}
      </div>
    </section>`
  }

  if (type === 'likert') {
    return renderLikert(block)
  }

  if (type === 'stats') {
    const {
      source,
      sheet,
      column,
      metrics = ['n', 'mean', 'median', 'std', 'min', 'max'],
      title = '',
    } = data
    if (!source || !sheet || !column) return ''
    const sheetData = source.data[sheet]
    if (!sheetData) return ''
    const colIndex = sheetData.headers.indexOf(column)
    if (colIndex === -1) return ''
    const values = sheetData.rows.map((r) => r[colIndex])
    const stats = computeStats(values, metrics)
    const titleHTML = title
      ? `<div class="chart-title">${escapeHTML(title)}</div>`
      : ''
    const cells = metrics
      .map(
        (m) => `<div class="stats-cell">
          <span class="stats-label">${escapeHTML(METRIC_LABELS[m] || m)}</span>
          <span class="stats-value">${escapeHTML(formatMetric(stats[m], m))}</span>
        </div>`,
      )
      .join('')
    return `${titleHTML}<div class="stats-grid">${cells}</div>`
  }

  if (type === 'map') {
    const {
      title = '',
      points = [],
      center = [31.5, 34.8],
      zoom = 8,
      colorByValue = false,
    } = data
    if (points.length === 0) return ''
    const titleHTML = title
      ? `<div class="chart-title">${escapeHTML(title)}</div>`
      : ''
    const payload = JSON.stringify({
      center,
      zoom,
      colorByValue,
      points: points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        label: p.label || '',
        value: p.value ?? null,
      })),
    })
    return `<div class="map-wrapper">${titleHTML}<div class="map-container" data-hrb-map='${payload.replace(/'/g, '&#39;')}'></div></div>`
  }

  return ''
}

const TOC_SCRIPT = `
(function() {
  document.querySelectorAll('.toc a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();
`

const CHART_SCRIPT = `
(function initCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'Heebo', system-ui, sans-serif";
  Chart.defaults.color = '#1a1a1a';
  function hexA(hex, a) {
    var m = /^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex);
    if (!m) return hex;
    return 'rgba(' + parseInt(m[1],16) + ',' + parseInt(m[2],16) + ',' + parseInt(m[3],16) + ',' + a + ')';
  }
  function build(cfg) {
    var kind = cfg.kind;
    if (kind === 'pie') {
      return {
        type: 'pie',
        data: {
          labels: cfg.labels,
          datasets: [{
            data: cfg.datasets[0].data,
            backgroundColor: cfg.labels.map(function(_, i) {
              var colors = ['#1e3a5f','#7c2d12','#556b2f','#b45309','#4b5563','#0f766e','#9333ea','#be185d'];
              return colors[i % colors.length];
            })
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', rtl: true, textDirection: 'rtl' }, tooltip: { rtl: true, textDirection: 'rtl' } }
        }
      };
    }
    if (kind === 'likert') {
      return {
        type: 'bar',
        data: {
          labels: cfg.labels,
          datasets: cfg.datasets.map(function(d) {
            return { label: d.label, data: d.data, backgroundColor: d.color };
          })
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          scales: {
            x: { stacked: true, position: 'top', reverse: true },
            y: { stacked: true, position: 'right' }
          },
          plugins: {
            legend: { position: 'bottom', rtl: true, textDirection: 'rtl', reverse: true },
            tooltip: { rtl: true, textDirection: 'rtl' }
          }
        }
      };
    }
    var chartType = (kind === 'area') ? 'line' : kind;
    return {
      type: chartType,
      data: {
        labels: cfg.labels,
        datasets: cfg.datasets.map(function(d) {
          var base = {
            label: d.label, data: d.data,
            borderColor: d.color, backgroundColor: (kind === 'area') ? hexA(d.color, 0.25) : d.color,
          };
          if (kind === 'line') { base.fill = false; base.tension = 0.2; }
          if (kind === 'area') { base.fill = true; base.tension = 0.2; }
          return base;
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { position: 'top', reverse: true },
          y: { position: 'right' }
        },
        plugins: {
          legend: { position: 'bottom', rtl: true, textDirection: 'rtl' },
          tooltip: { rtl: true, textDirection: 'rtl' }
        }
      }
    };
  }
  document.querySelectorAll('[data-hrb-chart]').forEach(function(canvas) {
    try {
      var cfg = JSON.parse(canvas.getAttribute('data-hrb-chart'));
      new Chart(canvas, build(cfg));
    } catch (err) { console.error('chart init error', err); }
  });
})();
`

const MAP_SCRIPT = `
(function initMaps() {
  if (typeof L === 'undefined') return;
  var LOW = [240, 245, 250], HIGH = [30, 58, 95];
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function color(t) { return 'rgb(' + lerp(LOW[0], HIGH[0], t) + ',' + lerp(LOW[1], HIGH[1], t) + ',' + lerp(LOW[2], HIGH[2], t) + ')'; }
  document.querySelectorAll('[data-hrb-map]').forEach(function(el) {
    try {
      var data = JSON.parse(el.getAttribute('data-hrb-map'));
      var map = L.map(el, { scrollWheelZoom: false }).setView(data.center, data.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      var vals = data.points.map(function(p) { return p.value; }).filter(function(v) { return typeof v === 'number'; });
      var minV = vals.length ? Math.min.apply(null, vals) : 0;
      var maxV = vals.length ? Math.max.apply(null, vals) : 0;
      var range = (maxV - minV) || 1;
      data.points.forEach(function(p) {
        var hasVal = p.value !== null && p.value !== undefined;
        var t = hasVal ? (p.value - minV) / range : 0;
        var fill = (data.colorByValue && hasVal) ? color(t) : '#0f766e';
        var marker = L.circleMarker([p.lat, p.lng], {
          radius: 8, fillColor: fill, color: '#111827', weight: 1, fillOpacity: 0.85
        }).addTo(map);
        var html = '<div style="direction:rtl;text-align:right;"><strong>' + (p.label || 'נקודה') + '</strong>';
        if (hasVal) html += '<div>ערך: ' + p.value + '</div>';
        html += '</div>';
        marker.bindPopup(html);
      });
    } catch (err) { console.error('map init error', err); }
  });
})();
`

export function buildReportHTML(title, blocks, theme = {}) {
  const headingIds = {}
  const seen = new Map()
  blocks.forEach((b) => {
    if (b.type !== 'heading') return
    const base = slugify(b.data.text, `section-${Object.keys(headingIds).length + 1}`)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    headingIds[b.id] = count === 0 ? base : `${base}-${count + 1}`
  })

  const headings = blocks
    .filter((b) => b.type === 'heading')
    .map((b) => ({
      id: headingIds[b.id],
      text: b.data.text || 'כותרת ריקה',
      level: b.data.level ?? 2,
    }))
  const showTOC = headings.length >= 3

  const tocHTML = showTOC
    ? `<nav class="toc" aria-label="תוכן עניינים">
        <h2>תוכן עניינים</h2>
        <ul>${headings
          .map(
            (h) =>
              `<li style="padding-inline-start:${(h.level - 1) * 10}px"><a href="#${h.id}">${escapeHTML(h.text)}</a></li>`,
          )
          .join('')}</ul>
      </nav>`
    : ''

  const blocksHTML = blocks
    .map((b) =>
      renderBlock(b, { headingIds, reportTitle: title, theme }),
    )
    .join('\n')

  const logoHTML = theme.logo
    ? `<img class="report-logo" src="${theme.logo}" alt="לוגו" />`
    : ''

  const fontsFamilies = [
    `${(theme.headingFont || 'Frank Ruhl Libre').replace(/ /g, '+')}:wght@400;700`,
    `${(theme.bodyFont || 'Heebo').replace(/ /g, '+')}:wght@400;500;600;700`,
  ]
  const fontsHref = `https://fonts.googleapis.com/css2?${fontsFamilies.map((f) => `family=${f}`).join('&')}&display=swap`

  const hasMap = blocks.some(
    (b) => b.type === 'map' && (b.data?.points?.length ?? 0) > 0,
  )
  const hasInteractiveChart = blocks.some((b) => {
    if (b.type === 'likert') {
      return b.data?.questions?.some((q) => q.responses?.some((r) => r > 0))
    }
    if (b.type === 'chart') {
      const d = b.data || {}
      if (d.chartType === 'imported') return false
      return d.source && d.sheet && d.xColumn && d.yColumns?.length > 0
    }
    return false
  })

  const leafletHTML = hasMap
    ? `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="" defer></script>`
    : ''
  const chartHTML = hasInteractiveChart
    ? `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" defer></script>`
    : ''
  const mapScript = hasMap ? `<script>window.addEventListener('load', function() { ${MAP_SCRIPT} });</script>` : ''
  const chartScript = hasInteractiveChart ? `<script>window.addEventListener('load', function() { ${CHART_SCRIPT} });</script>` : ''

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(title || 'דוח')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${fontsHref}" rel="stylesheet" />
${leafletHTML}
${chartHTML}
<style>${buildDocStyles(theme)}</style>
</head>
<body>
<div class="container${showTOC ? ' with-toc' : ''}">
${tocHTML}
<article class="article">
${logoHTML}
<h1 class="report-title">${escapeHTML(title || 'דוח')}</h1>
${blocksHTML}
</article>
</div>
<script>${TOC_SCRIPT}</script>
${mapScript}
${chartScript}
</body>
</html>`.trim()
}

export function downloadReport(title, blocks, theme = {}) {
  const html = buildReportHTML(title, blocks, theme)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'דוח'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function printReport(title, blocks, theme = {}) {
  const html = buildReportHTML(title, blocks, theme)
  const existing = document.getElementById('__hrb_print_frame')
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = '__hrb_print_frame'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1000)
  }

  iframe.addEventListener('load', () => {
    try {
      const win = iframe.contentWindow
      if (!win) return
      win.addEventListener('afterprint', cleanup, { once: true })
      setTimeout(() => {
        try {
          win.focus()
          win.print()
        } catch (err) {
          console.error(err)
          cleanup()
        }
      }, 400)
    } catch (err) {
      console.error(err)
      cleanup()
    }
  })

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    alert('כשל ביצירת מסגרת הדפסה')
    cleanup()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
}
