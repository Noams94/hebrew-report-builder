# בונה דוחות — Hebrew Report Builder

אפליקציית web מקומית (רצה על המחשב שלך) ליצירת דוחות אינטראקטיביים בעברית. עורך מבוסס בלוקים בסגנון Notion עם תצוגה מקדימה חיה, וייצוא לקובץ HTML עצמאי אחד.

A local web app for building interactive Hebrew reports. Notion-style block editor with a live preview panel and export to a single standalone HTML file.

---

## התקנה / Installation

```bash
npm install
```

## הפעלה בפיתוח / Development

```bash
npm run dev
```

פתח את הדפדפן ב- <http://localhost:5173> (או בפורט שמופיע בקונסול).

## בנייה / Build

```bash
npm run build
npm run preview
```

---

## תכונות / Features

- **עורך מבוסס בלוקים**: כותרת (H1/H2/H3), טקסט (Markdown בסיסי), תמונה (העלאה / גרירה / הדבקה), גרף מנתוני Excel (עמודות / קווי / שטח / עוגה), טבלה (ידני או ייבוא Excel), קו מפריד
- **גרירה ושחרור** לסידור בלוקים מחדש (`@dnd-kit`)
- **תצוגה מקדימה חיה** עם תוכן עניינים אוטומטי כשיש 3+ כותרות
- **שמירה אוטומטית** ל-localStorage
- **ייצוא ל-HTML** — קובץ יחיד עצמאי עם CSS מוטמע, תמונות base64, וגרפים כ-SVG inline
- **Print-friendly**: עיצוב הדפסה מובנה ב-HTML שמיוצא

---

## מבנה הפרויקט / Project structure

```
src/
├── main.jsx                  # React entry point
├── App.jsx                   # Root layout (Toolbar + Editor + Preview)
├── index.css                 # Tailwind + prose styles
├── store/
│   └── reportStore.js        # Zustand store + persist middleware
├── components/
│   ├── Toolbar.jsx           # Top bar: title, new, export
│   ├── Editor.jsx            # Right panel: block list + DnD context
│   ├── Preview.jsx           # Left panel: rendered report + TOC
│   ├── BlockMenu.jsx         # "+" add-block popup
│   ├── BlockWrapper.jsx      # Per-block: drag handle, duplicate, delete
│   ├── SortableBlock.jsx     # dnd-kit useSortable wrapper
│   ├── ChartRenderer.jsx     # Shared Recharts renderer (editor + preview + export)
│   └── blocks/
│       ├── HeadingBlock.jsx
│       ├── TextBlock.jsx
│       ├── ImageBlock.jsx
│       ├── ChartBlock.jsx
│       ├── TableBlock.jsx
│       └── DividerBlock.jsx
└── lib/
    ├── markdown.js           # Safe Markdown → HTML (escapes first)
    ├── excel.js              # SheetJS parseExcel helper
    ├── slugify.js            # Hebrew-safe heading-anchor slugs
    └── export.js             # Standalone HTML builder + download trigger
```

---

## הוספת סוג בלוק חדש / Adding a new block type

1. הוסף את שם הסוג לברירות-המחדל ב-`src/store/reportStore.js` (`defaultDataByType`).
2. צור קומפוננטה חדשה ב-`src/components/blocks/MyBlock.jsx` שמקבלת `{ block }` ומשתמשת ב-`updateBlock(block.id, ...)`.
3. רשום את הקומפוננטה ב-`BLOCK_COMPONENTS` שב-`src/components/SortableBlock.jsx`.
4. הוסף אייקון ופריט בתפריט ב-`BLOCK_TYPES` שב-`src/components/BlockMenu.jsx`.
5. הוסף רינדור preview ב-`src/components/Preview.jsx` (בתוך `PreviewBlock`).
6. הוסף רינדור HTML סטטי ב-`src/lib/export.js` (בתוך `renderBlock`).

---

## קיצורי מקלדת / Keyboard shortcuts

- `Ctrl/Cmd + S` — ייצוא ל-HTML
- `Ctrl/Cmd + N` — דוח חדש (מאתחל את הכל, עם אישור)

---

## Tech stack

- **Vite** + **React 18** (JavaScript)
- **Tailwind CSS** v3 (RTL-friendly)
- **Zustand** + `persist` middleware
- **@dnd-kit** for drag & drop
- **Recharts** for charts (saves as inline SVG in exports)
- **SheetJS (xlsx)** for Excel parsing
- **lucide-react** for icons
- **Heebo** (UI) + **Frank Ruhl Libre** (report headings) from Google Fonts
