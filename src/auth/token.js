import { Keypair, Transaction } from "stellar-sdk";
import Client from "../client";
import { verify } from "../utils/keypair";

/** Checks challenge transaction signed by user on developer's side. */
export default class Token {
  /**
   * @param {string} developerSecret - Developer private key
   * @param {string} xdr - Challenge transaction xdr
   * @param {string} address - User public key
   */
  constructor(developerSecret, xdr, address) {
    this._developerSecret = developerSecret;
    this._tx = new Transaction(xdr);
    this._address = address;
    this._keypair = undefined;
    this._theirKeypair = undefined;
  }
  /**
   * Returns time bounds for given transaction
   * @returns {StellarSdk.xdr.TimeBounds} Time bounds for given transaction (`minTime` and `maxTime`)
   */
  get timeBounds() {
    const { timeBounds } = this._tx;

    if (!timeBounds) {
      throw new Error("Wrong challenge transaction structure");
    }

    return timeBounds;
  }

  /**
   * Validates transaction signed by developer and user.
   * @param {boolean} [strict=true] - if true, checks that lower time limit is within Mobius::Client.strict_interval seconds from now
   * @returns {boolean} true if transaction is valid, raises exception otherwise
   */
  validate(strict = true) {
    if (!this._signedCorrectly) {
      throw new Error("Wrong challenge transaction signature");
    }

    const bounds = this.timeBounds;

    if (!this._timeNowCovers(bounds)) {
      throw new Error("Challenge transaction expired");
    }

    if (strict && this._tooOld(bounds)) {
      throw new Error("Challenge transaction expired");
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

  /**
   * @private
   * @returns {StellarSdk.Keypair} Keypair object for given Developer private key
   */
  get _getKeypair() {
    this._keypair = this._keypair || Keypair.fromSecret(this._developerSecret);

    return this._keypair;
  }

  /**
   * @private
   * @returns {StellarSdk.Keypair} Keypair object of user being authorized
   */
  get _getTheirKeypair() {
    this._theirKeypair =
      this._theirKeypair || Keypair.fromPublicKey(this._address);

    return this._theirKeypair;
  }

  /**
   * @private
   * @returns {boolean} true if transaction is correctly signed by user and developer
   */
  get _signedCorrectly() {
    const isSignedByDeveloper = verify(this._tx, this._getKeypair);
    const isSignedByUser = verify(this._tx, this._getTheirKeypair);

    return isSignedByDeveloper && isSignedByUser;
  }

  /**
   * @private
   * @param {StellarSdk.xdr.TimeBounds} timeBounds - Time bounds for given transaction
   * @returns {boolean} true if current time is within transaction time bounds
   */
  _timeNowCovers(timeBounds) {
    const now = Math.floor(new Date().getTime() / 1000);

    return (
      now >= parseInt(timeBounds.minTime, 10) &&
      now <= parseInt(timeBounds.maxTime, 10)
    );
  }

  /**
   * @param {StellarSdk.xdr.TimeBounds}timeBounds - Time bounds for given transaction
   * @returns {boolean} true if transaction is created more than 10 secods from now
   */
  _tooOld(timeBounds) {
    const now = Math.floor(new Date().getTime() / 1000);

    return now > parseInt(timeBounds.minTime, 10) + Client.strictInterval;
  }
}
