import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder
} from "stellar-sdk";
import Client from "../client";

/** Generates challenge transaction on developer's side. */
const Challenge = {
  /**
   * Generates challenge transaction signed by developers private key.
   * @param {string} developerSecret - Developers private key
   * @param {number} expireIn - Session expiration time in seconds from now. Default is Client.challengeExpiresIn.
   * @returns {string} base64-encoded transaction envelope
   */
  call(developerSecret, expireIn = null) {
    const keypair = this._keypair(developerSecret);
    const account = new Account(keypair.publicKey(), this._randomSequence());
    const tx = new TransactionBuilder(account, {
      memo: this._memo(),
      timebounds: this._buildTimeBounds(expireIn)
    })
      .addOperation(
        Operation.payment({
          account: Keypair.random(),
          destination: keypair.publicKey(),
          sequence: this._randomSequence(),
          amount: "0.000001",
          asset: Asset.native()
        })
      )
      .build();

    tx.sign(keypair);

    return tx.toEnvelope().toXDR("base64");
  },

  /**
   * @private
   * @param {string} developerSecret - Developers private key
   * @returns {StellarSdk.Keypair} StellarSdk.Keypair
   */
  _keypair(developerSecret) {
    return Keypair.fromSecret(developerSecret);
  },

  /**
   * @private
   * @returns {number} Random sequence number
   */
  _randomSequence() {
    return (99999999 - Math.floor(Math.random() * 65536)).toString();
  },

  /**
   * @private
   * @param {number} expireIn - session expiration time in seconds from now
   * @returns {object} Time bounds (`minTime` and `maxTime`)
   */
  _buildTimeBounds(expireIn) {
    const minTime = Math.floor(new Date().getTime() / 1000).toString();
    const maxTime = Math.floor(
      new Date().getTime() / 1000 + (expireIn || Client.challengeExpiresIn)
    ).toString();

    return {
      minTime,
      maxTime
    };
  },

  /**
   * @private
   * @returns {StellarSdk.Memo} Auth transaction memo
   */
  _memo() {
    return Memo.text("Mobius authentication");
  }
};

export default Challenge;
