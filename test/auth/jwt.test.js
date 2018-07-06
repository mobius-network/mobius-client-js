import { Keypair, Network } from "stellar-sdk";
import { freeze, reset } from "timekeeper";
import Challenge from "../../src/auth/challenge";
import Sign from "../../src/auth/sign";
import Token from "../../src/auth/token";
import JWT from "../../src/auth/jwt";

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
  const jwt = new JWT("somekey");

  let token;

  beforeAll(() => {
    Network.useTestNetwork();

    const tx = generateSignedChallengeTx(userKeypair, developerKeypair);
    token = new Token(developerKeypair.secret(), tx, userKeypair.publicKey());
  });

  it(".encode() returns string jwt token", () => {
    freeze(new Date());
    expect(jwt.encode(token)).toBeDefined();
  });

  it(".decode() returns payload", () => {
    const payload = jwt.decode(jwt.encode(token));
    expect(payload.sub).toBe(developerKeypair.publicKey());
  });

  afterEach(() => {
    reset();
  });
});
