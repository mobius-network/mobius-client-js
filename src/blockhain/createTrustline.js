import { TransactionBuilder, Operation } from "stellar-sdk";
import Client from "../client";
import AccountBuilder from "./accountBuilder";

/** Creates unlimited trustline for given asset. */
const CreateTrustline = {
  /**
   * @param {StellarSdk.Keypair} keypair - Account keypair
   * @param {StellarSdk.Asset} asset
   * @returns {Promise}
   */
  async call(keypair, asset = Client.stellarAsset) {
    const client = new Client().horizonClient;
    const account = await AccountBuilder.build(keypair);
    const tx = this._tx(account.info, asset);

    tx.sign(account.keypair);

    client.submitTransaction(tx);
  },

  /**
   * Generate changeTrust transaction with given parameters.
   * @private
   * @param {Account} account
   * @param {StellarSdk.Asset} asset
   * @returns {StellarSdk.Transaction}
   */
  _tx(account, asset) {
    return new TransactionBuilder(account)
      .addOperation(
        Operation.changeTrust({
          asset
        })
      )
      .build();
  }
};

export default CreateTrustline;
