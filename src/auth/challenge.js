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
   * @param {number} [expireIn=Client.challengeExpiresIn] - Session expiration time in seconds from now.
   * @returns {string|Buffer} base64-encoded transaction envelope
   */
  call(developerSecret, expireIn = Client.challengeExpiresIn) {
    const keypair = Keypair.fromSecret(developerSecret);
    const now = Math.floor(new Date().getTime() / 1000);

    const tx = new TransactionBuilder(this._randomAccount(), {
      memo: Memo.text("Mobius authentication"),
      timebounds: { minTime: now, maxTime: now + expireIn }
    })
      .addOperation(
        Operation.payment({
          account: keypair,
          destination: keypair.publicKey(),
          amount: "1",
          asset: Asset.native()
        })
      )
      .build();

    tx.sign(keypair);

    return tx.toEnvelope().toXDR("base64");
  },

  /**
   * @private
   * @returns {Account} Random account with random sequence
   */
  _randomAccount() {
    const keypair = Keypair.random();
    return new Account(keypair.publicKey(), this._randomSequence());
  },

  /**
   * @private
   * @returns {string} Random sequence number
   */
  _randomSequence() {
    return (99999999 - Math.floor(Math.random() * 65536)).toString();
  }
};

export default Challenge;
