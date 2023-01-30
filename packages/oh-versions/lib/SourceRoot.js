import SourceFile from "./SourceFile.js";
import Lockfile from "./Lockfile.js";
import fsp from "node:fs/promises";
import path from "node:path";
import { diff_match_patch } from 'diff-match-patch'
/**
 * @typedef SourceRootConfig
 * @property {string} owner
 * @property {string} repo
 * @property {string} cacheRoot
 * @property {string} srcRoot
 * @property {string} buildRoot
 * @property {string} remoteRoot
 * @property {string} prefix
 * @property {string} [baseUrl]
 * @property {import('diff-match-patch').diff_match_patch} [dmp]
 */

/**
 *
 */
export default class SourceRoot {
  /**
   * @param {SourceRootConfig}opts
   */
  constructor(opts) {
    this.opts = opts
    this.lockfile = new Lockfile(opts.cacheRoot)
    if (!opts.dmp) {
      this.opts.dmp = new diff_match_patch()
    }
  }

  /**
   *
   * @param {string} filename
   * @return SourceFile
   */
  ref(filename) {
    const {
      cacheRoot,
      srcRoot,
      remoteRoot,
      owner,
      repo,
      dmp,
      prefix
    } = this.opts
    return new SourceFile(filename, {
      cacheDir: cacheRoot,
      repo,
      owner,
      dmp,
      srcDir: srcRoot,
      srcPrefix: prefix,
      prefix: remoteRoot,
      lockfile: this.lockfile,
      baseUrl: this.opts.baseUrl ?? 'https://raw.githubusercontent.com/',
    })
  }

  async touch(filename, version) {
    await this.ref(filename).touch(version)
  }

  /**
   *
   * @param {string}version
   */
  async migrate(version) {
    for (const [file, originVersion] of Object.entries(this.lockfile.content.src)) {
      const content = await this.ref(file).migrate(originVersion, version)
      const buildFilename = path.join(this.opts.buildRoot, version, file)
      await fsp.mkdir(path.dirname(buildFilename), {recursive: true})
      await fsp.writeFile(buildFilename, content)
    }
  }
}