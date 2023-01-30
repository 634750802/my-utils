import SourceRoot from "oh-versions";

export default new SourceRoot({
  owner: 'discourse',
  repo: 'discourse',
  srcRoot: 'demo/src',
  cacheRoot: 'demo/cache',
  buildRoot: 'demo/dist',
  remoteRoot: 'app/assets/javascripts/discourse/app',
  prefix: 'javascripts/discourse',
  baseUrl: 'https://ghproxy.com/https://raw.githubusercontent.com/',
})
