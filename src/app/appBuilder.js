import { Keypair } from "stellar-sdk";
import AccountBuilder from "../blockchain/accountBuilder";
import App from "./app";

const AppBuilder = {
  /**
   * @param {string} developerSecret - Developer private key
   * @param {string} address - User public key
   */
  async build(developerSecret, address) {
    const developerKeypair = Keypair.fromSecret(developerSecret);
    const developerAccount = await AccountBuilder.build(developerKeypair);

    const userKeypair = Keypair.fromPublicKey(address);
    const userAccount = await AccountBuilder.build(userKeypair);

    return new App(developerAccount, userAccount);
  }
};

export default AppBuilder;
