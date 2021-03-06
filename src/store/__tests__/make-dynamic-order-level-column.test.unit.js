import { makeFlatConfig, normalizeConfig } from '../../configuration'
import { makeDynamicOrderLevelColumn } from '../sql-generators'

// should only give the higher one when their depths are unequal
describe('make dynamic order level column', () => {
  const galleryPostImgTag = global.__GALLERY_POST_IMG_TAG__
  const fullConfig = normalizeConfig(galleryPostImgTag)
  const flatConfig = makeFlatConfig(fullConfig)

  it(`should always be '0' when there arent any cases`, () => {
    const scrapersToGetOut = ['tag']
    const caseSql = makeDynamicOrderLevelColumn(flatConfig, scrapersToGetOut)
    expect(caseSql).toBe('0')
  })
  it('should order when the one is higher than the other at the same depth', () => {
    const scrapersToGetOut = ['img', 'tag']
    const caseSql = makeDynamicOrderLevelColumn(flatConfig, scrapersToGetOut)
    expect(caseSql).toBe(
      `CASE WHEN cte.scraper = 'img' AND recurseDepth = 1 THEN 1000 WHEN cte.scraper = 'tag' AND recurseDepth = 1 THEN 100 ELSE 10000 END`
    )
  })
  it('should keep order at the same recurseDepth when they are approaching from the same depth', () => {
    const scrapersToGetOut = ['img-parse', 'tag']
    const caseSql = makeDynamicOrderLevelColumn(flatConfig, scrapersToGetOut)
    expect(caseSql).toBe(
      `CASE WHEN cte.scraper = 'img-parse' AND recurseDepth = 0 THEN 101 WHEN cte.scraper = 'tag' AND recurseDepth = 0 THEN 100 ELSE 1000 END`
    )
  })
  it(`should combine several approaching different depths properly`, () => {
    const scrapersToGetOut = ['img-parse', 'img', 'tag']
    const caseSql = makeDynamicOrderLevelColumn(flatConfig, scrapersToGetOut)
    expect(caseSql).toBe(
      `CASE WHEN cte.scraper = 'img-parse' AND recurseDepth = 0 THEN 101 WHEN cte.scraper = 'img' AND recurseDepth = 0 THEN 1000 WHEN cte.scraper = 'tag' AND recurseDepth = 1 THEN 100 ELSE 10000 END`
    )
  })
})
