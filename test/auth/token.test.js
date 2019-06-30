import { Keypair, Network } from "stellar-sdk";
import { freeze, reset } from "timekeeper";
import ms from "ms";
import Challenge from "../../src/auth/challenge";
import Sign from "../../src/auth/sign";
import Token from "../../src/auth/token";

describe("Auth.Token", () => {
  const user = Keypair.random();
  const app = Keypair.random();
  const currentTime = Date.now();
  let signedTx;
  const token = (appKeypair = app, userKeypair = user) => {
    return new Token(appKeypair.secret(), signedTx, userKeypair.publicKey());
  };

  beforeAll(() => {
    Network.useTestNetwork();
  });

  beforeEach(() => {
    freeze(currentTime);
    const tx = Challenge.call(app.secret());
    signedTx = Sign.call(user.secret(), tx, app.publicKey());
  });

  afterEach(() => {
    reset();
  });

  it(".validate() returns true if current time is within bounds", () => {
    freeze(currentTime + ms("2s"));

    expect(token().validate()).toBe(true);
  });

  it(".validate() throws if token created in future", () => {
    freeze(currentTime - ms("1s"));

    expect(() => token().validate()).toThrowError(/expired/);
  });

  it(".validate() throws in strict mode if more than 10 seconds passed", () => {
    freeze(currentTime + ms("11s"));

    expect(() => token().validate()).toThrowError(/too old/);
  });

  it(".validate() returns true in non-strict mode if more than 10 seconds passed", () => {
    freeze(currentTime + ms("11s"));

    expect(token().validate(false)).toBe(true);
  });

  it(".validate() throws error if current time is outside bounds", () => {
    freeze(currentTime + ms("25h"));

    expect(() => token().validate()).toThrowError(/expired/);
  });

  it(".validate() throws error if app signature is wrong", () => {
    const badToken = token(Keypair.random(), user);
    expect(() => badToken.validate()).toThrowError(/by app/);
  });

  it(".validate() throws error if user signature is wrong", () => {
    const badToken = token(app, Keypair.random());
    expect(() => badToken.validate()).toThrowError(/by user/);
  });

  it("returns transaction hash", () => {
    expect(token().hash()).toBeDefined();
  });

  it("returns transaction time bounds", () => {
    const timestamp = Math.floor(currentTime / 1000);
    expect(token().timeBounds.minTime).toBe(timestamp);
    expect(token().timeBounds.maxTime).toBe(timestamp + 3600 * 24);
  });
});
