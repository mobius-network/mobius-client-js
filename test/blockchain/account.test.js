import { Keypair, Network } from "stellar-sdk";
import AccountBuilder from "../../src/blockhain/accountBuilder";

describe("AccountBuilder", () => {
  beforeAll(() => {
    Network.useTestNetwork();
  });

  describe("when account is missing", () => {
    const keypair = Keypair.fromSecret(
      "SDSZGWR22BNISMXUXBYOKRWVAFYIQA4SX2MZLAF6MB5OHOPGES7GBPCV"
    );

    it("fails", () => {
      expect.assertions(1);

      return expect(AccountBuilder.build(keypair)).rejects.toThrow();
    });
  });

  describe("when account has not trustline & authorization", () => {
    const keypair = Keypair.fromSecret(
      "SA2VTRSZPZ5FICNHEUISJVAZNE5IGKUTXFZX6ISHX3JAI4QD7LBWUUIK"
    );

    test(".trustlineExists() should eq false", async () => {
      expect.assertions(1);

      const account = await AccountBuilder.build(keypair);

      expect(account.trustlineExists()).toBeFalsy();
    });

    test(".balance() should eq null", async () => {
      expect.assertions(1);

      const account = await AccountBuilder.build(keypair);

      expect(account.balance()).toBeFalsy();
    });

    test(".authorized() should eq false", async () => {
      expect.assertions(1);

      const otherKeypair = Keypair.random();

      const account = await AccountBuilder.build(keypair);

      expect(account.authorized(otherKeypair)).toBeFalsy();
    });
  });

  describe("when account has trustline & authorization", () => {
    const keypair = Keypair.fromSecret(
      "SAAR4WYBEMS3HWZROEGJDDSMINYOK6PLSDX5AYEPO5AIVXWRFY2M6SBK"
    );

    test(".trustlineExists() should eq true", async () => {
      expect.assertions(1);

      const account = await AccountBuilder.build(keypair);

      expect(account.trustlineExists()).toBeTruthy();
    });

    test(".balance() should eq 1000", async () => {
      expect.assertions(1);

      const account = await AccountBuilder.build(keypair);

      expect(account.balance()).toBe(1000);
    });

    test(".authorized() should eq true", async () => {
      expect.assertions(1);

      const otherKeypair = keypair;

      const account = await AccountBuilder.build(keypair);

      expect(account.authorized(otherKeypair)).toBeTruthy();
    });
  });
});
