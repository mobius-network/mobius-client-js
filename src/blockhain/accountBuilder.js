import Client from "../client";
import Account from "./account";

const AccountBuilder = {
  /**
   * Get account information from Stellar network and returns an instance of Account
   * @returns {Promise}
   */
  async build(keypair) {
    const accountId = keypair.publicKey();
    const account = await new Client().horizonClient.loadAccount(accountId);

    return new Account(account, keypair);
  }
};

export default AccountBuilder;
