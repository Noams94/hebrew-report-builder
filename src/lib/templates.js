const h = (level, text) => ({ type: 'heading', data: { level, text } })
const p = (markdown) => ({ type: 'text', data: { markdown } })
const hr = () => ({ type: 'divider', data: {} })

export const TEMPLATES = [
  {
    id: 'blank-he',
    lang: 'he',
    name: 'ריק',
    description: 'דוח ריק להתחלה מאפס',
    blocks: [],
  },
  {
    id: 'market-he',
    lang: 'he',
    name: 'דוח שוק',
    description: 'תקציר, מגמות, טבלת נתונים, תובנות ומסקנות',
    titleHint: 'דוח שוק',
    blocks: [
      h(1, 'תקציר מנהלים'),
      p('_כתוב כאן סיכום של עד 3–4 פסקאות, עם הממצאים המרכזיים וההמלצות._'),
      hr(),
      h(2, 'רקע ומתודולוגיה'),
      p('מקורות הנתונים, תאריכי איסוף, גודל המדגם, הגדרות מרכזיות.'),
      h(2, 'מגמות מרכזיות'),
      p('- **מגמה 1:** ...\n- **מגמה 2:** ...\n- **מגמה 3:** ...'),
      h(2, 'ניתוח מפורט'),
      p('הוסף כאן גרף או טבלה דרך תפריט הבלוקים.'),
      h(2, 'מסקנות והמלצות'),
      p('_סכם את ההשלכות הפרקטיות._'),
    ],
  },
  {
    id: 'survey-he',
    lang: 'he',
    name: 'דוח סקר',
    description: 'מתודולוגיה, דמוגרפיה, תוצאות Likert, תובנות',
    titleHint: 'דוח סקר',
    blocks: [
      h(1, 'רקע הסקר'),
      p('**מטרת הסקר:** \n\n**קהל היעד:** \n\n**תקופת איסוף:** '),
      h(2, 'מתודולוגיה'),
      p(
        '- שיטת דגימה: ...\n- כלי הסקר: שאלון מובנה בן X שאלות\n- מספר משיבים: N = ...\n- שיעור השבה: ...%',
      ),
      h(2, 'פרופיל המשיבים'),
      p('הוסף כאן טבלה או גרף עם פילוח דמוגרפי (מין, גיל, אזור).'),
      h(2, 'תוצאות עיקריות'),
      p('_הוסף בלוק Likert להצגת התפלגות התשובות._'),
      h(2, 'תובנות'),
      p('- תובנה ראשונה\n- תובנה שנייה\n- תובנה שלישית'),
      h(2, 'המלצות להמשך'),
      p('_אילו פעולות לבצע בעקבות הממצאים?_'),
    ],
  },
  {
    id: 'academic-he',
    lang: 'he',
    name: 'דוח אקדמי',
    description: 'תקציר, שיטה, תוצאות, דיון, מקורות',
    titleHint: 'מחקר',
    blocks: [
      h(1, 'תקציר'),
      p(
        '_תקציר של עד 250 מילים: רקע, שאלת המחקר, שיטה, ממצאים מרכזיים, מסקנה._',
      ),
      h(2, 'הקדמה'),
      p('הצגת הבעיה והשאלה המחקרית. סקירת ספרות קצרה.'),
      h(2, 'שיטה'),
      p(
        '**משתתפים:** \n\n**כלים:** \n\n**הליך:** \n\n**ניתוח סטטיסטי:** ',
      ),
      h(2, 'תוצאות'),
      p('_שלב כאן טבלאות, גרפים וסיכומים סטטיסטיים._'),
      h(2, 'דיון'),
      p('פרשנות הממצאים לאור הספרות, מגבלות המחקר, כיווני המשך.'),
      h(2, 'מקורות'),
      p(
        '- שם המחבר (שנה). *שם המאמר*. כתב עת, כרך(גיליון), עמודים.\n- ...',
      ),
    ],
  },
  {
    id: 'blank-en',
    lang: 'en',
    name: 'Blank',
    description: 'Empty report to start from scratch',
    blocks: [],
  },
  {
    id: 'market-en',
    lang: 'en',
    name: 'Market report',
    description: 'Summary, trends, data table, insights and conclusions',
    titleHint: 'Market report',
    blocks: [
      h(1, 'Executive summary'),
      p('_Write a 3–4 paragraph summary with the main findings and recommendations._'),
      hr(),
      h(2, 'Background and methodology'),
      p('Data sources, collection dates, sample size, key definitions.'),
      h(2, 'Key trends'),
      p('- **Trend 1:** ...\n- **Trend 2:** ...\n- **Trend 3:** ...'),
      h(2, 'Detailed analysis'),
      p('Add a chart or a table from the block menu.'),
      h(2, 'Conclusions and recommendations'),
      p('_Summarize the practical implications._'),
    ],
  },
  {
    id: 'survey-en',
    lang: 'en',
    name: 'Survey report',
    description: 'Methodology, demographics, Likert results, insights',
    titleHint: 'Survey report',
    blocks: [
      h(1, 'Survey background'),
      p('**Purpose:** \n\n**Target audience:** \n\n**Collection period:** '),
      h(2, 'Methodology'),
      p(
        '- Sampling method: ...\n- Instrument: structured questionnaire with X items\n- Respondents: N = ...\n- Response rate: ...%',
      ),
      h(2, 'Respondent profile'),
      p('Add a table or chart with demographic breakdown (gender, age, region).'),
      h(2, 'Key results'),
      p('_Add a Likert block to show the distribution of responses._'),
      h(2, 'Insights'),
      p('- First insight\n- Second insight\n- Third insight'),
      h(2, 'Recommendations'),
      p('_Which actions follow from the findings?_'),
    ],
  },
  {
    id: 'academic-en',
    lang: 'en',
    name: 'Academic report',
    description: 'Abstract, methods, results, discussion, references',
    titleHint: 'Research',
    blocks: [
      h(1, 'Abstract'),
      p('_Up to 250 words: background, research question, method, key findings, conclusion._'),
      h(2, 'Introduction'),
      p('Present the problem and research question. Brief literature review.'),
      h(2, 'Methods'),
      p('**Participants:** \n\n**Instruments:** \n\n**Procedure:** \n\n**Statistical analysis:** '),
      h(2, 'Results'),
      p('_Embed tables, charts, and statistical summaries here._'),
      h(2, 'Discussion'),
      p('Interpret the findings in light of the literature, limitations, and directions for future work.'),
      h(2, 'References'),
      p('- Author (Year). *Article title*. Journal, Volume(Issue), pages.\n- ...'),
    ],
  },
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export function instantiateTemplate(id, lang = 'he') {
  const template = getTemplate(id)
  const fallbackTitle = lang === 'en' ? 'New report' : 'דוח חדש'
  return {
    title: template.titleHint || fallbackTitle,
    lang: template.lang || lang,
    blocks: template.blocks.map((b) => ({
      type: b.type,
      data: structuredClone(b.data),
    })),
  }
}
