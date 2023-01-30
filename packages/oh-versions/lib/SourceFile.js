import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import {md5} from "./utils.js";
import ora from 'ora';
import chalk from "chalk";

/**
 * @typedef SourceFileOptions
 * @property {string} owner
 * @property {string} repo
 * @property {string} cacheDir
 * @property {string} srcDir
 * @property {string} prefix
 * @property {string} srcPrefix
 * @property {import('diff-match-patch').diff_match_patch} dmp
 * @property {Lockfile} lockfile
 * @property {string} baseUrl
 */

/**
 *
 */
export default class SourceFile {
  /**
   * @type string
   */
  pathname

  /**
   * @type SourceFileOptions
   */
  opts


  /**
   * @param {string} pathname
   * @param {SourceFileOptions} opts
   */
  constructor(pathname, opts) {
    this.opts = opts
    this.pathname = pathname
  }

  get localFilename() {
    return path.join(this.opts.srcDir, this.opts.srcPrefix, this.pathname)
  }

  /**
   *
   * @param {string | 'local'}version
   * @return Promise<string>
   * @async
   * @throws
   */
  async read(version) {
    const spinner = ora(`Loading ${this.pathname}`).start();

    if (version === 'local') {
      spinner.stop()
      const filepath = this.localFilename
      await fsp.access(filepath, fsp.constants.R_OK | fsp.constants.O_RDONLY)
      return await fsp.readFile(filepath, {encoding: 'utf-8'})
    }

    const cacheName = path.join(version, this.pathname)
    const filepath = path.join(this.opts.cacheDir, 'raw', cacheName)

    spinner.text = `Loading ${cacheName}`

    if (fs.existsSync(filepath)) {
      const content = await fsp.readFile(filepath, {encoding: 'utf-8'})
      if (this.opts.lockfile.hitCache(cacheName, md5(content))) {
        spinner.stop()
        return content
      }
      spinner.text = `Content was changed, loading ${cacheName} from github`
      spinner.color = 'yellow'
    } else {
      spinner.text = `Loading ${cacheName} from github`
      spinner.color = 'cyan'
    }

    const url = `${this.opts.baseUrl}${this.opts.owner}/${this.opts.repo}/${path.join(version, this.opts.prefix, this.pathname)}`
    const response = await fetch(url)
    if (!response.ok) {
      spinner.fail(`error: ${url} ${await response.text()}`)
      process.exit(-1)
    }
    const text = await response.text()
    this.opts.lockfile.setCache(cacheName, md5(text))

    await fsp.mkdir(path.dirname(filepath), {recursive: true})
    await fsp.writeFile(filepath, text)
    spinner.stop()
    return text
  }

  /**
   *
   * @param {string} version
   * @param {boolean} failIfExists
   * @return {Promise<string>}
   */
  async checkout(version, failIfExists = true) {
    if (version === 'local') {
      console.error('error: local is not a valid version')
      process.exit(-1)
    }
    try {
      await this.read('local');
      if (failIfExists) {
        console.error(`error: file ${this.localFilename} already exists`)
        process.exit(-1)
      }
    } catch (e) {
      const content = await this.read(version);
      await fsp.mkdir(path.dirname(this.localFilename), {recursive: true})
      await fsp.writeFile(this.localFilename, content);

      // update lockfile
      this.opts.lockfile.setSrc(this.pathname, version)
    }
  }

  async touch(version) {
    await this.checkout(version, false)
  }

  /**
   *
   * @param {string} from
   * @param {string | 'local'} to
   * @return {Promise<import('diff-match-patch').Diff[]>}
   * @async
   */
  async diff(from, to) {
    const {dmp} = this.opts
    const fromText = await this.read(from)
    const toText = await this.read(to)

    return dmp.diff_main(fromText, toText)
  }


  /**
   *
   * @param {string} from
   * @param {string | 'local'} to
   * @return {Promise<string>}
   * @async
   */
  async diffText(from, to) {
    const {dmp} = this.opts
    return dmp.patch_toText(dmp.patch_make(await this.diff(from, to)))
  }

  async migrate(from, to) {
    if (from === to) {
      return await this.read('local')
    }

    const spinner = ora(`Migrating ${this.pathname} ${from} -> ${to}`).start()

    const {dmp} = this.opts
    // local - from => from ~> local
    const diff = await this.diff(from, 'local')
    const src = await this.read(to)
    // to + from ~> local => local'
    const [content, allPoints] = dmp.patch_apply(dmp.patch_make(diff), src)

    if (allPoints.find(one => one === false) === false) {
      spinner.fail(`error: Failed to migrate ${this.pathname} from ${from} to ${to}`)
      process.exit(-1)
    }

    spinner.succeed(`${chalk.underline(this.pathname)} ${chalk.gray(from)} -> ${chalk.green(to)}: ${chalk.yellow(allPoints.length)} changes`)
    return content
  }
}