import { Keypair, Network } from "stellar-sdk";
import { freeze, reset } from "timekeeper";
import Challenge from "../../src/auth/challenge";
import Sign from "../../src/auth/sign";
import Token from "../../src/auth/token";

function generateSignedChallengeTx(userKeypair, developerKeypair) {
  const tx = Challenge.call(developerKeypair.secret());
  const signedTx = Sign.call(
    userKeypair.secret(),
    tx,
    developerKeypair.publicKey()
  );

  return signedTx;
}

describe("Auth.Token", () => {
  const userKeypair = Keypair.random();
  const developerKeypair = Keypair.random();

  beforeAll(() => {
    Network.useTestNetwork();
  });

  it(".validate() returns true if current time is within bounds", () => {
    freeze(new Date());

    const tx = generateSignedChallengeTx(userKeypair, developerKeypair);
    const token = new Token(
      developerKeypair.secret(),
      tx,
      userKeypair.publicKey()
    );

    expect(token.validate()).toBe(true);
  });

  it(".validate() throws error if current time is outside bounds", () => {
    const tx = generateSignedChallengeTx(userKeypair, developerKeypair);
    const token = new Token(
      developerKeypair.secret(),
      tx,
      userKeypair.publicKey()
    );
    const futureTime = Math.floor(new Date().getTime() / 1000 + 3600 * 5);

    freeze(futureTime);

    expect(() => token.validate()).toThrow();
  });

  it("returns transaction hash", () => {
    const tx = generateSignedChallengeTx(userKeypair, developerKeypair);
    const token = new Token(
      developerKeypair.secret(),
      tx,
      userKeypair.publicKey()
    );

    expect(token.hash()).toBeDefined();
  });

  afterEach(() => {
    reset();
  });
});
