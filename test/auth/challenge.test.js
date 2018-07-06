import { Keypair, Network, Transaction } from "stellar-sdk";
import { freeze, reset } from "timekeeper";
import { verify } from "../../src/utils/keypair";
import Challenge from "../../src/auth/challenge";
import Client from "../../src/client";

describe("Auth.Challenge", () => {
  const keypair = Keypair.random();
  let tx;

  beforeAll(() => {
    Network.useTestNetwork();

    freeze(new Date());

    tx = new Transaction(Challenge.call(keypair.secret()));
  });

  it("signs challenge correctly by developer", () => {
    expect(verify(tx, keypair)).toBe(true);
  });

  it("contains memo", () => {
    expect(tx.memo.value).toMatch(/Mobius authentication/);
  });

  it("contains time bounds", () => {
    expect(tx.timeBounds).not.toBeUndefined();
  });

  it("contains correct minimum time bound", () => {
    const timeNow = Math.floor(new Date().getTime() / 1000).toString();
    expect(tx.timeBounds.minTime).toEqual(timeNow);
  });

  it("contains correct maximum time bound by default", () => {
    const timeNow = Math.floor(
      new Date().getTime() / 1000 + Client.challengeExpiresIn
    ).toString();

    expect(tx.timeBounds.maxTime).toEqual(timeNow);
  });

  it("contains correct custom maximum time bound", () => {
    tx = new Transaction(Challenge.call(keypair.secret(), 60));
    const timeNow = Math.floor(new Date().getTime() / 1000 + 60).toString();

    expect(tx.timeBounds.maxTime).toEqual(timeNow);
  });

  afterAll(() => {
    reset();
  });
});
