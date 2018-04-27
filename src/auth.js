import "whatwg-fetch";
import { Promise } from "es6-promise";
import URI from "urijs";
import StellarSdk from "stellar-sdk";

function randomSequence() {
  return (99999999 - Math.floor(Math.random() * 65536)).toString();
}

function buildTimeBounds() {
  return new StellarSdk.xdr.TimeBounds({
    minTime: new Date().getTime(),
    maxTime: new Date().getTime() + 3600
  });
}

function generateChallenge(developerSecret) {
  const keypair = StellarSdk.Keypair.fromSecret(developerSecret);
  const account = new StellarSdk.Account(keypair.publicKey(), randomSequence());

  const tx = new StellarSdk.TransactionBuilder(account)
    .addOperation(
      StellarSdk.Operation.payment({
        account: StellarSdk.Keypair.random(),
        destination: keypair.publicKey(),
        sequence: randomSequence(),
        amount: "0.000001",
        asset: StellarSdk.Asset.native(),
        memo: "Mobius authentication",
        timeBounds: buildTimeBounds()
      })
    )
    .build();

  tx.sign(keypair);

  return tx.toEnvelope().toXDR("base64");
}

function fetchChallenge(endpoint, appPublicKey) {
  const url = URI(endpoint).toString();
  const keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);

  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(body => {
        const tx = new StellarSdk.Transaction(body);

        if (!keypair.verify(tx.hash(), tx.signatures[0].signature())) {
          reject(new Error("Wrong challenge transaction signature"));
          return;
        }

        resolve(tx);
      });
  });
}

function fetchToken(endpoint, tx, userSecret) {
  return new Promise((resolve, reject) => {
    const url = URI(endpoint).toString();
    const keypair = StellarSdk.Keypair.fromSecret(userSecret);

    tx.sign(keypair);

    const req = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        xdr: tx.toEnvelope().toXDR("base64"),
        public_key: keypair.publicKey()
      })
    };

    return fetch(url, req).then(response => {
      if (response.ok) {
        resolve(response.text());
      }

      response.json().then(json => reject(new Error(json.error)));
    });
  });
}

function verifyToken(xdr, userPublicKey, appSecret) {
  return new Promise((resolve, reject) => {
    const tx = new StellarSdk.Transaction(xdr);
    const userKeypair = StellarSdk.Keypair.fromPublicKey(userPublicKey);
    const appKeypair = StellarSdk.Keypair.fromSecret(appSecret);
    const appVerified = appKeypair.verify(
      tx.hash(),
      tx.signatures[0].signature()
    );
    const userVerified = userKeypair.verify(
      tx.hash(),
      tx.signatures[1].signature()
    );

    if (!appVerified || !userVerified) {
      return reject(Error("Signatures invalid"));
    }

    return resolve(tx.hash().toString("hex"));
  });
}

export { generateChallenge, fetchChallenge, verifyToken, fetchToken };
