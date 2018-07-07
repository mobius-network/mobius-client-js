import { Keypair, Network, Transaction } from "stellar-sdk";
import { verify } from "../../src/utils/keypair";
import Challenge from "../../src/auth/challenge";
import Sign from "../../src/auth/sign";

describe("Auth.Sign", () => {
  const user = Keypair.random();
  const app = Keypair.random();
  const challenge = (keypair = app) => Challenge.call(keypair.secret());

  beforeAll(() => {
    Network.useTestNetwork();
  });

  it("signs challenge correctly by user", () => {
    const tx = Sign.call(user.secret(), challenge(), app.publicKey());

    expect(verify(new Transaction(tx), user)).toBe(true);
  });

  it("throws if challenge has invalid app signature", () => {
    const anotherApp = Keypair.random();

    expect(() => {
      Sign.call(user.secret(), challenge(), anotherApp.publicKey());
    }).toThrowError(/signature/);
  });
});
