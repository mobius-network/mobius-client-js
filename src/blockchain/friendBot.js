import Client from "../client";

/** Calls Stellar FriendBot */
const FriendBot = {
  /**
   * @param {StellarSdk.Keypair} keypair - Keypair of account to fund
   * @returns {Promise}
   */
  call(keypair) {
    const address = keypair.accountId();

    return new Client().horizonClient.friendbot(address);
  }
};

export default FriendBot;
