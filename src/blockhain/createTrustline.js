import { TransactionBuilder, Operation } from "stellar-sdk";
import Client from "../client";
import Account from "./account";

/** # Creates unlimited trustline for given asset. */
const CreateTrustline = {
  /**
   * Executes an operation.
   * @param {StellarSdk.Keypair} keypair - Account keypair
   * @param {StellarSdk.Asset} asset
   * @returns {Promise}
   */
  call(keypair, asset = Client.stellarAsset) {
    const client = this._client();
    const account = this._account(keypair);

    return account.info().then(acc => {
      const tx = this._tx(acc, asset);

      tx.sign(account.account());

      return client.submitTransaction(tx);
    });
  },

  /**
   * Generate changeTrust transaction with given parameters
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

export default CreateTrustline;
