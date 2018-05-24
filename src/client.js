import { Asset, Network, Networks, Server } from "stellar-sdk";

export default class Client {
  constructor() {
    this._assetCode = undefined;
    this._assetIssuer = undefined;
    this._challengeExpiresIn = undefined;
    this._horizonClient = undefined;
    this._mobiusHost = undefined;
    this._network = Network.current()
      ? Network.current().networkPassphrase()
      : undefined;
    this._stellarAsset = undefined;
    this._strictInterval = undefined;
  }

  /**
   * Get Mobius API host
   * @returns {string} Mobius API host
   */
  static get mobiusHost() {
    this._mobiusHost = this._mobiusHost || "https://mobius.network";

    return this._mobiusHost;
  }

  /**
   * Set Stellar network to use
   * @param {string} value - network passphrase
   */
  set network(value) {
    this._network = value;

    Network.use(this._network);
  }

  /**
   * Get current network
   * @returns {string} value - Stellar network passphrase
   */
  get network() {
    this._network = this._network || Networks.TESTNET;

    return this._network;
  }

  /**
   * Get StellarSdk.Server instance
   * @returns {StellarSdk.Server} StellarSdk.Server instance
   */
  get horizonClient() {
    if (this._horizonClient) {
      return this._horizonClient;
    }

    const horizonClient =
      this.network === Networks.TESTNET
        ? new Server("https://horizon-testnet.stellar.org")
        : new Server("https://horizon.stellar.org");

    this._horizonClient = horizonClient;

    return this._horizonClient;
  }

  /**
   * Get Mobius Asset code
   * @returns {string} Mobius Asset code
   */
  static get assetCode() {
    this._assetCode = this._assetCode || "MOBI";

    return this._assetCode;
  }

  /**
   * Get Asset Issuer account ID
   * @returns {string} Asset Issuer account ID
   */
  static get assetIssuer() {
    if (this._assetIssuer) {
      return this._assetIssuer;
    }

    const assetIssuer =
      this.network === Networks.PUBLIC
        ? "GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH"
        : "GDRWBLJURXUKM4RWDZDTPJNX6XBYFO3PSE4H4GPUL6H6RCUQVKTSD4AT";

    this._assetIssuer = assetIssuer;

    return this._assetIssuer;
  }

  /**
   * Get Challenge expiration value
   * @returns {number} Challenge expiration value in seconds (1d by defaul)
   */
  static get challengeExpiresIn() {
    this._challengeExpiresIn = this._challengeExpiresIn || 60 * 60 * 24;

    return this._challengeExpiresIn;
  }

  /**
   * Get Stellar Asset instance of asset used for payments
   * @returns {StellarSdk.Asset} instance of asset used for payments
   */
  static get stellarAsset() {
    if (this._stellarAsset) {
      return this._stellarAsset;
    }

    const stellarAsset = new Asset(this.assetCode, this.assetIssuer);

    this._stellarAsset = stellarAsset;

    return this._stellarAsset;
  }

  /**
   * In strict mode, session must be not older than seconds from now
   * @returns {number} strict interval value in seconds (10 by default)
   */
  static get strictInterval() {
    this._strictInterval = this._strictInterval || 10;

    return this._strictInterval;
  }
}
