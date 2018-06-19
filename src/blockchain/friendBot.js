import Client from "../client";

/** Calls Stellar FriendBot */
const FriendBot = {
  /**
   * @param {StellarSdk.Keypair} keypair - Keypair of account to fund
   * @returns {Promise}
   */
  call(keypair) {
    const publicKey = keypair.publicKey();

    return new Client().horizonClient.friendbot(publicKey).call();
  }
};

export default FriendBot;
