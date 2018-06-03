import { Operation, TransactionBuilder } from "stellar-sdk";
import Client from "../client";

/** Interface to user balance in application. */
export default class App {
  /**
   * @param {Account} appAcount - App account
   * @param {Account} userAccount - User account
   */
  constructor(appAccount, userAccount) {
    this._appAccount = appAccount;
    this._clientInstance = new Client().horizonClient;
    this._fee = 100;
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
   * Makes payment from user account to application and optional third party.
   * @param {number} amount - Payment amount
   * @param {any} [thirdPartyAddress=null] - Optional: third party receiver address
   * @returns {Promise}
   */
  async pay(amount, thirdPartyAddress = null) {
    if (this.userBalance < parseFloat(amount)) {
      throw new Error("Insufficient Funds");
    }

    const tx = this._paymentTransaction(amount, thirdPartyAddress);

    tx.sign(this.appKeypair);

    const response = await this._clientInstance.submitTransaction(tx);

    await this.appAccount.reload();
    await this.userAccount.reload();

    return response;
  }

  /**
   * Sends money from application account to third party.
   * @param {number} amount - Payment amount
   * @param {any} [thirdPartyAddress=null] - Optional: third party receiver address
   * @returns {Promise}
   */
  async transfer(amount, thirdPartyAddress) {
    if (this.appBalance < parseFloat(amount)) {
      throw new Error("Insufficient Funds");
    }

    const tx = this._transferTransaction(amount, thirdPartyAddress);

    tx.sign(this.appKeypair);

    const response = await this._clientInstance.submitTransaction(tx);

    await this.appAccount.reload();
    await this.userAccount.reload();

    return response;
  }

  /**
   * @private
   * @returns {number} user balance limit
   */
  get _userLimit() {
    const balance = this._userBalanceObject;

    if (balance) {
      return parseFloat(balance.limit);
    }

    return null;
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * @param {string} thirdPartyAddress - third party receiver address
   * @returns {StellarSdk.Transaction} payment transaction
   */
  _paymentTransaction(amount, thirdPartyAddress) {
    const tx = new TransactionBuilder(this.userAccount.info, {
      fee: this._fee
    }).addOperation(this._paymentOperation(amount));

    if (thirdPartyAddress) {
      tx.addOperation(
        this._thirdPartyPaymentOperation(amount, thirdPartyAddress)
      );
    }

    return tx.build();
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * @returns {StellarSdk.Operation} payment operation
   */
  _paymentOperation(amount) {
    return Operation.payment({
      amount: amount.toString(),
      asset: Client.stellarAsset,
      destination: this.appKeypair.publicKey()
    });
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * @param {string} thirdPartyAddress - third party receiver address
   * @returns {StellarSdk.Operation} payment operation
   */
  _thirdPartyPaymentOperation(amount, thirdPartyAddress) {
    return Operation.payment({
      amount: amount.toString(),
      asset: Client.stellarAsset,
      destination: thirdPartyAddress
    });
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * @param {string} thirdPartyAddress - third party receiver address
   * @returns {StellarSdk.Transaction} payment transaction
   */
  _transferTransaction(amount, thirdPartyAddress) {
    return new TransactionBuilder(this.appAccount.info)
      .addOperation(this._paymentOperation(amount, thirdPartyAddress))
      .build();
  }

  /**
   * @private
   * @param {number} amount - payment amount
   * * @param {string} thirdPartyAddress - third party receiver address
   * @returns {StellarSdk.Operation} payment operation
   */
  _transferOperation(amount, thirdPartyAddress) {
    return Operation.payment({
      amount: amount.toString(),
      asset: Client.stellarAsset,
      destination: thirdPartyAddress
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
