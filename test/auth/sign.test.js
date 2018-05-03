import { Keypair, Network, Transaction } from "stellar-sdk";
import { verify } from "../../src/utils/keypair";
import Challenge from "../../src/auth/challenge";
import Sign from "../../src/auth/sign";

function generateSignedChallengeTx(userKeypair, developerKeypair) {
  const tx = Challenge.call(developerKeypair.secret());
  const signedTx = Sign.call(
    userKeypair.secret(),
    tx,
    developerKeypair.publicKey()
  );

  return signedTx;
}

describe("Auth.Sign", () => {
  const userKeypair = Keypair.random();
  const developerKeypair = Keypair.random();

  beforeAll(() => {
    Network.useTestNetwork();
  });

  it("signs challenge correctly by user", () => {
    const tx = generateSignedChallengeTx(userKeypair, developerKeypair);

    expect(verify(new Transaction(tx), userKeypair)).toBe(true);
  });
});
