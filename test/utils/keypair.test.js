import {
  Account,
  Asset,
  Keypair,
  Network,
  Operation,
  TransactionBuilder
} from "stellar-sdk";
import { verify } from "../../src/utils/keypair";

function generateSignedTx(keypair) {
  const account = new Account(
    keypair.publicKey(),
    (99999999 - Math.floor(Math.random() * 65536)).toString()
  );
  const tx = new TransactionBuilder(account)
    .addOperation(
      Operation.payment({
        account: Keypair.random(),
        destination: keypair.publicKey(),
        sequence: (99999999 - Math.floor(Math.random() * 65536)).toString(),
        amount: "0.000001",
        asset: Asset.native()
      })
    )
    .build();

  tx.sign(keypair);

  return tx;
}

describe("utils/keypair", () => {
  beforeAll(() => {
    Network.useTestNetwork();
  });

  it("returns true if transaction is correctly signed", () => {
    const keypair = Keypair.random();
    const tx = generateSignedTx(keypair);

    expect(verify(tx, keypair)).toBe(true);
  });

  it("returns false if transaction is not correctly signed", () => {
    const keypair = Keypair.random();
    const anotherKeypair = Keypair.random();
    const tx = generateSignedTx(keypair);

    expect(verify(tx, anotherKeypair)).toBe(false);
  });
});
