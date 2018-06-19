import Client from "../client";

/** Calls Stellar FriendBot */
const FriendBot = {
  /**
   * @param {StellarSdk.Keypair} keypair - Keypair of account to fund
   * @returns {Promise}
   */
  call(keypair) {
    return new Client().horizonClient.friendbot(keypair.address());
  }
};

export default FriendBot;
