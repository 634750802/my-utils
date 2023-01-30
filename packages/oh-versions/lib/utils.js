import crypto from "node:crypto";

/**
 *
 * @param {import('crypto').BinaryLike} content
 * @return {string}
 */
export function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}