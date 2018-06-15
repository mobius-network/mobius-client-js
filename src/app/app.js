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
    this._validateUserBalance();

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
    if (this.userBalance < Number(amount)) {
      throw new Error("Insufficient Funds");
    }

    return this._submitTx(tx => {
      tx.addOperation(this._userPaymentOp(amount, this.appKeypair.publicKey()));

      if (destination) {
        tx.addOperation(this._appPaymentOp(amount, destination));
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
  async payout(amount, destination = this.userKeypair.publicKey()) {
    if (this.appBalance < Number(amount)) {
      throw new Error("Insufficient Funds");
    }

    return this._submitTx(tx => {
      tx.addOperation(this._appPaymentOp(amount, destination));
    });
  }

  /**
   * Sends money from the user account to the third party directly.
   * @param {number} amount - Payment amount
   * @param {string} destination - third party receiver address
   * @returns {Promise}
   */
  async transfer(amount, destination) {
    if (this.userBalance < Number(amount)) {
      throw new Error("Insufficient Funds");
    }

    return this._submitTx(tx => {
      tx.addOperation(this._userPaymentOp(amount, destination));
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
   * @param {number} amount - payment amount
   * @param {string} destination - receiver address
   * @returns {Operation} payment operation
   */
  _userPaymentOp(amount, destination) {
    return Operation.payment({
      asset: Client.stellarAsset,
      amount: amount.toString(),
      source: this.userKeypair.publicKey(),
      destination
    });
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * @param {string} destination - receiver address
   * @returns {Operation} payment operation
   */
  _appPaymentOp(amount, destination) {
    return Operation.payment({
      asset: Client.stellarAsset,
      amount: amount.toString(),
      source: this.appKeypair.publicKey(),
      destination
    });
  }

  /**
   * @private
   * @returns {boolean} true if developer is authorized to use an application and trustline exists
   */
  _validateUserBalance() {
    if (!this.authorized) {
      throw new Error("Authorisation missing");
    }

    if (!this.userAccount.trustlineExists()) {
      throw new Error("Trustline not found");
    }

    return true;
  }
}
