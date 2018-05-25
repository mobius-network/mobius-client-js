import { TransactionBuilder, Operation } from "stellar-sdk";
import Client from "../client";
import AccountBuilder from "./accountBuilder";

/** Adds account as cosigner to other account. */
const AddCosigner = {
  /**
   * @param {StellarSdk.Keypair} keypair - Account keypair
   * @param {StellarSdk.Keypair} cosignerKeypair - Cosigner account keypair
   * @param {number} [weight=1] - Cosigner weight
   * @returns {Promise}
   */
  async call(keypair, cosignerKeypair, weight = 1) {
    const client = new Client().horizonClient;
    const account = await AccountBuilder.build(keypair);
    const tx = this._tx(account.info, cosignerKeypair, weight);

    tx.sign(account.keypair);

    client.submitTransaction(tx);
  },

  /**
   * Generate setOptions transaction with given parameters.
   * @private
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
  }
};

export default AddCosigner;
