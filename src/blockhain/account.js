import { Keypair } from "stellar-sdk";
import { Promise } from "es6-promise";
import Client from "../client";

/** Service class used to interact with account on Stellar network. */
export default class Account {
  /**
   * @param {StellarSdk.Keypair} keypair - account keypair
   */
  constructor(keypair) {
    this._keypair = keypair;
    this._account = undefined;
    this._accountInfo = undefined;
  }

  /**
   * Returns true if trustline exists for given asset and limit is positive.
   * @param {StellarSdk.Asset}
   * @returns {boolean} true if trustline exists
   */
  trustlineExists(asset = Client.stellarAsset) {
    try {
      const balance = this._findBalance(asset);
      const limit = balance && parseFloat(balance.limit);

      return limit > 0;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Returns balance for given asset
   * @param {StellarSdk.Asset} [asset=Client.stellarAsset]
   * @returns {number}
   */
  balance(asset = Client.stellarAsset) {
    try {
      const balance = this._findBalance(asset);

      if (balance) {
        return parseFloat(balance.balance);
      }

      return null;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Returns true if given keypair is added as cosigner to current account.
   * @param {StellarSdk.Keypair} toKeypair
   * @returns {boolean} true if cosigner added
   */
  authorized(toKeypair) {
    try {
      const signer = this._findSigner(toKeypair.publicKey());

      return !!signer;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * @returns {StellarSdk.Keypair} Keypair object as account
   */
  account() {
    if (this._account) {
      return this._account;
    }

    const account = this._keypair.canSign()
      ? Keypair.fromSecret(this._keypair.secret())
      : Keypair.fromPublicKey(this._keypair.publicKey());

    this._account = account;

    return this._account;
  }

  /**
   * Requests and caches Account information from network.
   * @returns {Promise}
   */
  info() {
    return new Promise((resolve, reject) => {
      if (this._accountInfo) {
        resolve(this._accountInfo);
      }

      const accountId = this.account().publicKey();

      new Client().horizonClient
        .loadAccount(accountId)
        .then(accountInfo => {
          this._accountInfo = accountInfo;

          resolve(this._accountInfo);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Invalidates account information cache.
   * @returns {Promise}
   */
  reload() {
    this._accountInfo = null;

    return this.info();
  }

  /**
   * @private
   * @param {StellarSdk.Asset} asset - Asset to find
   * @returns {object} matched balance entry
   */
  _findBalance(asset) {
    try {
      const balance = this._accountInfo.balances.reduce(
        (acc, val) => (this._balanceMatches(asset, val) ? val : acc)
      );

      return balance;
    } catch (error) {
      throw new Error("Stellar account does not exists");
    }
  }

  /**
   * @param {StellarSdk.Asset} asset - Asset to compare
   * @param {any} balance - balance entry to compare
   * @returns {boolean} true if balance matches with given asset
   */
  _balanceMatches(asset, balance) {
    const {
      asset_type: assetType,
      asset_code: assetCode,
      asset_issuer: assetIssuer
    } = balance;

    if (asset.isNative()) {
      return assetType === "native";
    }

    const assetIssuerPublicKey = Keypair.fromPublicKey(
      asset.issuer
    ).publicKey();

    return assetCode === asset.code && assetIssuer === assetIssuerPublicKey;
  }

  /**
   * @param {string} publicKey - signer's key to find
   * @returns {object} matched signer entry
   */
  _findSigner(publicKey) {
    try {
      const signer = this._accountInfo.signers.reduce(
        (acc, val) => (val.public_key === publicKey ? val : acc)
      );

      return signer;
    } catch (error) {
      throw new Error("Stellar account does not exists");
    }
  }
}
