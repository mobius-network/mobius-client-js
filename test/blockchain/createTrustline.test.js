import { Keypair, Network } from "stellar-sdk";
import CreateTrustline from "../../src/blockhain/createTrustline";

describe("CreateTrustline", () => {
  beforeAll(() => {
    Network.useTestNetwork();
  });

  describe("when account is missing", () => {
    const keypair = Keypair.fromSecret(
      "SDSZGWR22BNISMXUXBYOKRWVAFYIQA4SX2MZLAF6MB5OHOPGES7GBPCV"
    );

    it(
      "fails",
      () => {
        expect.assertions(1);

        return expect(CreateTrustline.call(keypair)).rejects.toThrow();
      },
      10000
    );
  });

  describe("when account is present", () => {
    const keypair = Keypair.fromSecret(
      "SDWISE5L2DNVGOFQJ2ZI5FNXMSMU7NVIB3Q62X7RMFMFYQZSFHZJE3TN"
    );

    it(
      "succeed",
      () => {
        expect.assertions(1);

        return expect(CreateTrustline.call(keypair)).resolves.toBeDefined();
      },
      10000
    );
  });
});
