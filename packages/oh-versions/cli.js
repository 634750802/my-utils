#!/usr/bin/env node --experimental-modules --no-warnings
import {program} from 'commander'
import packageJson from './package.json' assert {type: 'json'}
import fsp from "node:fs/promises";
import URL from 'node:url'
import path from 'node:path'

const CONFIG_FILE_NAME = 'oh-versions.config.mjs'

program
  .name('oh-versions')
  .description('Manage your changes across versions')
  .version(packageJson.version)

program
  .command('init')
  .description('Create a new oh-versions.config.mjs file')
  .argument('[DIRECTORY]', 'Target directory')
  .action(async (directory = '.') => {
    await fsp.copyFile(path.join(path.dirname(URL.fileURLToPath(import.meta.url)), 'demo', CONFIG_FILE_NAME), path.join(directory, CONFIG_FILE_NAME))
  })

program
  .command('touch')
  .description('Ensure a file was checkout')
  .argument('<REF>', 'Ref')
  .argument('<PATH>', 'File path')
  .option('--project-root, -P <DIR>', 'Project root', '.')
  .action(async (ref, name, options) => {
    const configPath = path.resolve(options.P, CONFIG_FILE_NAME)
    const {default: sourceRoot} = await import(configPath)
    await sourceRoot.touch(name, ref)
  })

program
  .command('migrate')
  .description('Migrate files to a specific version')
  .argument('<VERSION>', 'Target version')
  .option('--project-root, -P <DIR>', 'Project root', '.')
  .action(async (version, options) => {
    const configPath = path.resolve(options.P, CONFIG_FILE_NAME)
    const {default: sourceRoot} = await import(configPath)
    await sourceRoot.migrate(version)
  })

program.parse()