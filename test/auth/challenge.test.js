import { Keypair, Network, Transaction } from "stellar-sdk";
import { freeze, reset } from "timekeeper";
import { verify } from "../../src/utils/keypair";
import Challenge from "../../src/auth/challenge";

describe("Auth.Challenge", () => {
  const keypair = Keypair.random();
  let tx;

  beforeAll(() => {
    Network.useTestNetwork();

    freeze(new Date());

    tx = new Transaction(Challenge.call(keypair.secret()));
  });

  it("signs challenge correctly by developer", () => {
    expect.assertions(1);

    expect(verify(tx, keypair)).toBe(true);
  });

  it("contains memo", () => {
    expect.assertions(1);

    expect(tx.memo.value).toMatch(/Mobius authentication/);
  });

  it("contains time bounds", () => {
    expect.assertions(1);

    expect(tx.timeBounds).not.toBeUndefined();
  });

  it("contains correct minimum bound", () => {
    expect.assertions(1);

    const timeNow = Math.floor(new Date().getTime() / 1000).toString();
    expect(tx.timeBounds.minTime).toEqual(timeNow);
  });

  afterAll(() => {
    reset();
  });
});
