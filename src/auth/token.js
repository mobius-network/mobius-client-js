import { Keypair, Transaction } from "stellar-sdk";
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
   * @returns {xdr.TimeBounds} Time bounds for given transaction (`minTime` and `maxTime`)
   */
  timeBounds() {
    const { timeBounds } = this._tx;

    if (!timeBounds) {
      throw new Error("Wrong challenge transaction structure");
    }

    return timeBounds;
  }

  /**
   * Validates transaction signed by developer and user.
   * @return {boolean} true if transaction is valid, raises exception otherwise
   */
  validate() {
    if (!this._signedCorrectly()) {
      throw new Error("Wrong challenge transaction signature");
    }

    const bounds = this.timeBounds();

    if (!this._timeNowCovers(bounds)) {
      throw new Error("Challenge transaction expired");
    }

    return true;
  }

  /**
   * @param {string} format="binary" format for output data
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
   * @returns {Keypair} Keypair object for given Developer private key
   */
  _getKeypair() {
    this._keypair = this._keypair || Keypair.fromSecret(this._developerSecret);

    return this._keypair;
  }

  /**
   * @private
   * @returns {Keypair} Keypair object of user being authorized
   */
  _getTheirKeypair() {
    this._theirKeypair =
      this._theirKeypair || Keypair.fromPublicKey(this._address);

    return this._theirKeypair;
  }

  /**
   * @private
   * @return {boolean} true if transaction is correctly signed by user and developer
   */
  _signedCorrectly() {
    const isSignedByDeveloper = verify(this._tx, this._getKeypair());
    const isSignedByUser = verify(this._tx, this._getTheirKeypair());

    return isSignedByDeveloper && isSignedByUser;
  }

  /**
   * @private
   * @param {xdr.TimeBounds} Time bounds for given transaction
   * @returns {Bool} true if current time is within transaction time bounds
   */
  _timeNowCovers(timeBounds) {
    const now = Math.floor(new Date().getTime() / 1000);

    return (
      now >= parseInt(timeBounds.minTime, 10) &&
      now <= parseInt(timeBounds.maxTime, 10)
    );
  }
}
