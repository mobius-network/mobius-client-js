import jwt from "jsonwebtoken";

const alg = "HS512";

/**
 * Generates JWT token based on valid token transaction signed by both parties
 * and decodes JWT token into hash.
 */
export default class JWT {
  /**
   * @param {string} secret - JWT secret
   */
  constructor(secret) {
    this._secret = secret;
  }

  /**
   * Encode Mobius auth token as a JSON Web Token
   * @param {Auth.Token} token - Token object
   * @param {Object} [options={}] - Additional claims for JWT token
   * @returns {string} JWT token
   */
  encode(token, options = {}) {
    const payload = {
      jti: token.hash("hex"),
      sub: token.address,
      iat: parseInt(token.timeBounds.minTime, 10),
      exp: parseInt(token.timeBounds.maxTime, 10),
      ...options
    };

    return jwt.sign(payload, this._secret, { algorithm: alg });
  }

  /**
   * Decode and verify a JSON Web Token.
   * @param {string} payload - JWT token
   * @returns {Object} Decoded JWT claims
   */
  decode(payload) {
    return jwt.verify(payload, this._secret);
  }
}
