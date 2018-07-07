import {
  Account,
  Asset,
  Keypair,
  Network,
  Operation,
  TransactionBuilder
} from "stellar-sdk";
import { verify } from "../../src/utils/keypair";

function account(keypair = Keypair.random()) {
  return new Account(
    keypair.publicKey(),
    (99999999 - Math.floor(Math.random() * 65536)).toString()
  );
}

function generateSignedTx(keypair) {
  const tx = new TransactionBuilder(account(keypair))
    .addOperation(
      Operation.payment({
        destination: keypair.publicKey(),
        amount: "1",
        asset: Asset.native()
      })
    )
    .build();

  tx.sign(keypair);

  return tx;
}

describe("utils/keypair", () => {
  const keypair = Keypair.random();
  const anotherKeypair = Keypair.random();

  beforeAll(() => {
    Network.useTestNetwork();
  });

  it("returns true if transaction is correctly signed", () => {
    const tx = generateSignedTx(keypair);

    expect(verify(tx, keypair)).toBe(true);
  });

  it("returns false if transaction is not correctly signed", () => {
    const tx = generateSignedTx(keypair);

    expect(verify(tx, anotherKeypair)).toBe(false);
  });

  it("returns false if transaction is not signed", () => {
    const tx = new TransactionBuilder(account(keypair)).build();

    expect(verify(tx, keypair)).toBe(false);
    expect(verify(tx, anotherKeypair)).toBe(false);
  });
});
