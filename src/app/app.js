import { Operation, TransactionBuilder } from "stellar-sdk";
import Client from "../client";
import deprecate from "../utils/deprecate";

/**
 * Transaction builder function.
 * @callback transactionBuildFn
 * @param {TransactionBuilder} tx
 */

/** Interface to user balance in application. */
export default class App {
  /**
   * @param {Account} appAccount - App account
   * @param {Account} userAccount - User account
   */
  constructor(appAccount, userAccount) {
    this._appAccount = appAccount;
    this._clientInstance = new Client().horizonClient;
    this._userAccount = userAccount;
    this._validateUserAccount();
  }

  /**
   * @returns {boolean} true if developer is authorized to use an application
   */
  get authorized() {
    return this._userAccount.authorized(this.appKeypair);
  }

  /**
   * @returns {Account} app acount
   */
  get appAccount() {
    return this._appAccount;
  }

  /**
   * @returns {number} app balance
   */
  get appBalance() {
    return this._appAccount.balance();
  }

  /**
   * @returns {StellarSdk.Keypair} StellarSdk.Keypair object for app
   */
  get appKeypair() {
    return this._appAccount.keypair;
  }

  /**
   * @returns {Account} user account
   */
  get userAccount() {
    return this._userAccount;
  }

  /**
   * @returns {number} user balance
   */
  get userBalance() {
    return this._userAccount.balance();
  }

  /**
   * @returns {StellarSdk.Keypair} StellarSdk.Keypair object for user
   */
  get userKeypair() {
    return this._userAccount.keypair;
  }

  /**
   * Charges specified amount from user account and then optionally transfers
   * it from app account to a third party in the same transaction.
   * @param {number} amount - Payment amount
   * @param {?string} [destination] - third party receiver address
   * @returns {Promise}
   */
  async charge(amount, destination = null) {
    this._ensureSufficientFunds(this.userAccount, amount);

    return this._submitTx(tx => {
      tx.addOperation(
        this._paymentOp(this.userAccount, amount, this.appAccount.address)
      );

      if (destination) {
        tx.addOperation(this._paymentOp(this.appAccount, amount, destination));
      }
    });
  }

  /**
   * @deprecated Please use `App.charge()` instead.
   * @param {number} amount - payment amount
   * @param {?string} destination - third party receiver address
   * @returns {StellarSdk.Operation} payment operation
   */
  pay = deprecate(
    (amount, destination = null) => this.charge(amount, destination),
    "`App.pay()` is deprecated, please use `App.charge()` instead."
  );

  /**
   * Sends money from the application account to the user or third party.
   * @param {number} amount - Payment amount
   * @param {string} [destination] - third party receiver address
   * @returns {Promise}
   */
  async payout(amount, destination = this.userAccount.address) {
    return this._sendPayment(this.appAccount, amount, destination);
  }

  /**
   * Sends money from the user account to the third party directly.
   * @param {number} amount - Payment amount
   * @param {string} destination - third party receiver address
   * @returns {Promise}
   */
  async transfer(amount, destination) {
    return this._sendPayment(this.userAccount, amount, destination);
  }

  /**
   * @private
   * @param {Account} account - Source account
   * @param {number} amount - Payment amount
   * @param {string} destination - Payment destination address
   * @returns {Promise}
   */
  async _sendPayment(account, amount, destination) {
    this._ensureSufficientFunds(account, amount);

    return this._submitTx(tx => {
      tx.addOperation(this._paymentOp(account, amount, destination));
    });
  }

  /**
   * @private
   * @param {transactionBuildFn} buildFn - callback to build the transaction
   * @returns {Promise} that resolves or rejects with response of horizon
   */
  async _submitTx(buildFn) {
    const builder = new TransactionBuilder(this.userAccount.info);
    buildFn(builder);
    const tx = builder.build();
    tx.sign(this.appKeypair);

    const response = await this._clientInstance.submitTransaction(tx);

    await this._reload();

    return response;
  }

  /**
   * @private
   * @returns {Promise} to reload app and user accounts
   */
  async _reload() {
    return Promise.all([this.appAccount.reload(), this.userAccount.reload()]);
  }

  /**
   * @private
   * @param {Account} account - account to send payment from
   * @param {number} amount - payment amount
   * @param {string} destination - receiver address
   * @returns {Operation} payment operation
   */
  _paymentOp(account, amount, destination) {
    return Operation.payment({
      asset: Client.stellarAsset,
      amount: amount.toString(),
      source: account.address,
      destination
    });
  }

  /**
   * @private
   * @returns {boolean} true if developer is authorized to use an application and trustline exists
   */
  _validateUserAccount() {
    if (!this.authorized) {
      throw new Error("Authorisation missing");
    }

    if (!this.userAccount.trustlineExists()) {
      throw new Error("Trustline not found");
    }

    return true;
  }

  /**
   * @private
   * @param {Account} account
   * @param {number|string} amount
   */
  _ensureSufficientFunds(account, amount) {
    if (account.balance() < Number(amount)) {
      throw new Error("Insufficient Funds");
    }
  }
}
