import { Keypair, Transaction } from "stellar-sdk";
import { verify } from "../utils/keypair";

/** Signs challenge transaction on user's side. */
const Sign = {
  /**
   * Adds signature to given transaction.
   * @param {string} userSecret - Users private key
   * @param {string} xdr - Challenge transaction xdr
   * @param {string} address = Developer public key
   * @returns {string} base64-encoded transaction envelope
   */
  call(userSecret, xdr, address) {
    const tx = new Transaction(xdr);
    const keypair = this._keypair(userSecret);
    const developerKeypair = this._developerKeypair(address);

    this._validate(developerKeypair, tx);

    tx.sign(keypair);

    return tx.toEnvelope().toXDR("base64");
  },

  /**
   * @private
   * @param {string} userSecret - Users private key
   * @returns {StellarSdk.Keypair} Keypair object for given users private key
   */
  _keypair(userSecret) {
    return Keypair.fromSecret(userSecret);
  },

  /**
   * @private
   * @param {string}  address - Developers public key
   * @returns {StellarSdk.Keypair} Keypair object for given developers public key
   */
  _developerKeypair(address) {
    return Keypair.fromPublicKey(address);
  },

  /**
   * Validates transaction is signed by developer.
   * @private
   * @param {StellarSdk.Keypair} keypair - Keypair object for given Developer public key
   * @param {StellarSdk.Transaction} tx - Transaction to verify
   * @returns {boolean} true is transaction is valid, throws error otherwise
   */
  _validate(keypair, tx) {
    const isValid = verify(tx, keypair);

    if (!isValid) {
      throw new Error("Wrong challenge transaction signature");
    }

    return true;
  }
};

export default Sign;
