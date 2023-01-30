import fs from "node:fs";

/**
 * @typedef LockfileContent
 * @property {number} version
 * @property {Record<string, string>} src
 * @property {Record<string, string>} cache
 */

/**
 *
 */

export default class Lockfile {
  /**
   * @type LockfileContent
   */
  content
  cacheDir

  constructor(cacheDir) {
    this.cacheDir = cacheDir
    try {
      this.content = JSON.parse(fs.readFileSync(`${cacheDir}/src-lock.json`, {encoding: 'utf-8'}))
    } catch {
      this.content = {
        version: 1,
        src: {},
        cache: {},
      }
    }
  }

  setSrc(name, version) {
    this.content.src[name] = version
    this.save()
  }

  setCache(name, md5) {
    this.content.cache[name] = md5
    this.save()
  }

  hitCache(name, md5) {
    return this.content.cache[name] === md5
  }

  save() {
    fs.mkdirSync(this.cacheDir, {recursive: true})
    fs.writeFileSync(`${this.cacheDir}/src-lock.json`, JSON.stringify(this.content, undefined, 2))
  }
}
