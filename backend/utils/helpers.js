/**
 * Base64 URL-encode a buffer or string
 * @param {Buffer|string} str - The string or buffer to encode
 * @returns {string} Base64 URL-encoded string
 */
export function base64URLEncode(str) {
  if (Buffer.isBuffer(str)) {
    return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}


