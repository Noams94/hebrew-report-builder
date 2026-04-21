import he from './he'
import en from './en'
import { useReportStore } from '../store/reportStore'

export const LOCALES = { he, en }

export const SUPPORTED_LANGUAGES = ['he', 'en']

export function getDict(lang) {
  return LOCALES[lang] || LOCALES.he
}

export function isRtl(lang) {
  return lang !== 'en'
}

export function useLang() {
  return useReportStore((s) => s.lang || 'he')
}

export function useT() {
  const lang = useLang()
  return getDict(lang)
}

export function useDir() {
  const lang = useLang()
  return isRtl(lang) ? 'rtl' : 'ltr'
}
