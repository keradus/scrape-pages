import { assertConfigType } from './assert-config-type'

const assignDownloadDefaults = download => {
  if (download === undefined) return undefined

  const defaults = {
    regexCleanup: undefined,
    increment: 0,
    initialIndex: 0,
    incrementUntil: undefined,
    headerTemplates: {},
    cookieTemplates: {},
    method: 'GET'
  }
  return typeof download === 'string'
    ? {
        ...defaults,
        urlTemplate: download
      }
    : {
        ...defaults,
        ...download
      }
}

const assignParseDefaults = parse => {
  if (parse === undefined) return undefined

  const defaults = {
    expect: 'html',
    attribute: undefined,
    regexCleanup: undefined
  }

  return typeof parse === 'string'
    ? {
        ...defaults,
        selector: parse
      }
    : {
        ...defaults,
        ...parse
      }
}

const fillInDefaultsRecurse = (level = 0, parentName = '') => (
  scrapeConfig,
  index = 0
) => {
  if (!scrapeConfig) return undefined

  const { name, download, parse, scrapeEach = [] } = scrapeConfig

  const internalName = `${parentName}${
    parentName ? '-' : ''
  }level_${level}_index_${index}`

  return {
    name: name || internalName,
    download: assignDownloadDefaults(download),
    parse: assignParseDefaults(parse),
    scrapeEach: Array.isArray(scrapeEach)
      ? scrapeEach.map(fillInDefaultsRecurse(level + 1, parentName))
      : [fillInDefaultsRecurse(level + 1)(scrapeEach)]
  }
}

const standardizeInput = input => {
  if (!input) return []
  const type = typeof input
  if (type === 'string') return { [input]: input }
  else return input
}

const normalizeConfig = config => {
  assertConfigType(config)

  const input = standardizeInput(config.input)

  const fullConfig = fillInDefaultsRecurse()(config.scrape)

  return {
    input,
    scrape: fullConfig
  }
}
export default normalizeConfig
