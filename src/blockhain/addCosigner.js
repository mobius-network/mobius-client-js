import { TransactionBuilder, Operation } from "stellar-sdk";
import Client from "../client";
import Account from "./account";

/** Adds account as cosigner to other account. */
const AddCosigner = {
  /**
   * Executes an operation.
   * @param {StellarSdk.Keypair} keypair - Account keypair
   * @param {StellarSdk.Keypair} cosignerKeypair - Cosigner account keypair
   * @param {number} [weight=1] - Cosigner weight
   * @returns {Promise}
   */
  call(keypair, cosignerKeypair, weight = 1) {
    const client = this._client();
    const account = this._account(keypair);

    return account.reload().then(acc => {
      const tx = this._tx(acc, cosignerKeypair, weight);

      tx.sign(account.account());

      return client.submitTransaction(tx);
    });
  },

  /**
   * Generate setOptions transaction with given parameters
   * @param {Account} account
   * @param {StellarSdk.Keypair} cosignerKeypair
   * @param {number} weight
   * @returns {StellarSdk.Transaction}
   */
  _tx(account, cosignerKeypair, weight) {
    return new TransactionBuilder(account)
      .addOperation(
        Operation.setOptions({
          highThreshold: 10,
          lowThreshold: 1,
          masterWeight: 10,
          medThreshold: 1,
          signer: {
            ed25519PublicKey: cosignerKeypair.publicKey(),
            weight
          }
        })
      )
      .build();
  },

  /**
   * @private
   * @param {StellarSdk.Keypair} keypair - Account keypair
   * @returns {Account} Account instance
   */
  _account(keypair) {
    return new Account(keypair);
  },

  _client() {
    return new Client().horizonClient;
  }
};

export default AddCosigner;
