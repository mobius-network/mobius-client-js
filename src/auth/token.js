import { Keypair, Transaction } from "stellar-sdk";
import Client from "../client";
import { verify } from "../utils/keypair";

/** Checks challenge transaction signed by user on developer's side. */
export default class Token {
  /**
   * @param {string} appSecret - Developer private key
   * @param {string} xdr - Challenge transaction xdr
   * @param {string} userPublicKey - User public key
   */
  constructor(appSecret, xdr, userPublicKey) {
    this._appKeypair = Keypair.fromSecret(appSecret);
    this._userKeypair = Keypair.fromPublicKey(userPublicKey);
    this._tx = new Transaction(xdr);
  }

  /**
   * Returns time bounds for given transaction
   * @returns {Object} Time bounds for given transaction (`minTime` and `maxTime`)
   */
  get timeBounds() {
    const { timeBounds } = this._tx;

    if (!timeBounds) {
      throw new Error("Wrong challenge transaction structure");
    }

    return {
      minTime: parseInt(timeBounds.minTime, 10),
      maxTime: parseInt(timeBounds.maxTime, 10)
    };
  }

  /**
   * Returns address this token is issued for.
   * @returns {string} Address.
   */
  get address() {
    return this._userKeypair.publicKey();
  }

  /**
   * Validates transaction signed by developer and user.
   * @param {boolean} [strict=true] - if true, checks that lower time limit is within Mobius::Client.strict_interval seconds from now
   * @returns {boolean} true if transaction is valid, raises exception otherwise
   */
  validate(strict = true) {
    const { minTime, maxTime } = this.timeBounds;
    const now = Math.floor(new Date().getTime() / 1000);

    if (now < minTime || now > maxTime) {
      throw new Error("Challenge transaction expired");
    }

    if (strict && now > minTime + Client.strictInterval) {
      throw new Error("Challenge transaction too old");
    }

    if (!verify(this._tx, this._appKeypair)) {
      throw new Error("Challenge transaction is not signed by app");
    }

    if (!verify(this._tx, this._userKeypair)) {
      throw new Error("Challenge transaction is not signed by user");
    }

    return true;
  }

  /**
   * @param {string} format="binary" - format for output data
   * @returns {Buffer|string} depends on `format` param passed
   */
  hash(format = "binary") {
    this.validate();

    const hash = this._tx.hash();

    if (format === "binary") {
      return hash;
    }

    return hash.toString("hex");
  }
}
