import { Asset, Network, Networks, Server } from "stellar-sdk";

const Issuers = {
  PUBLIC: "GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH",
  TESTNET: "GDRWBLJURXUKM4RWDZDTPJNX6XBYFO3PSE4H4GPUL6H6RCUQVKTSD4AT"
};

const Urls = {
  TESTNET: "https://horizon-testnet.stellar.org",
  PUBLIC: "https://horizon.stellar.org"
};

export default class Client {
  constructor() {
    this._assetIssuer = undefined;
    this._challengeExpiresIn = undefined;
    this._horizonClient = undefined;
    this._network = Network.current()
      ? Network.current().networkPassphrase()
      : Networks.TESTNET;
    this._stellarAsset = undefined;
  }

  /**
   * Get Mobius API host
   * @returns {string} Mobius API host
   */
  static mobiusHost = "https://mobius.network";

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
   * @returns {string} Stellar network passphrase
   */
  get network() {
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
      this.network === Networks.PUBLIC
        ? new Server(Urls.PUBLIC)
        : new Server(Urls.TESTNET);

    this._horizonClient = horizonClient;

    return this._horizonClient;
  }

  /**
   * Get Mobius Asset code
   * @returns {string} Mobius Asset code
   */
  static assetCode = "MOBI";

  /**
   * Get Asset Issuer account ID
   * @returns {string} Asset Issuer account ID
   */
  static get assetIssuer() {
    if (this._assetIssuer) {
      return this._assetIssuer;
    }

    const assetIssuer =
      this.network === Networks.PUBLIC ? Issuers.PUBLIC : Issuers.TESTNET;

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
   * In strict mode, session must be not older than 10 seconds from now
   * @returns {number} strict interval value in seconds (10 by default)
   */
  static strictInterval = 10;
}
