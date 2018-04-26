import "whatwg-fetch";
import { Promise } from "es6-promise";
import URI from "urijs";
import StellarSdk from "stellar-sdk";
import Challenge from "./auth/challenge";
import Sign from "./auth/sign";
import Token from "./auth/token";

function fetchChallenge(endpoint, appPublicKey) {
  const url = URI(endpoint).toString();
  const keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);

  return fetch(url)
    .then(response => response.text())
    .then(body => {
      const tx = new StellarSdk.Transaction(body);

      if (!keypair.verify(tx.hash(), tx.signatures[0].signature())) {
        Promise.reject(new Error("Wrong challenge transaction signature"));
        return;
      }

      Promise.resolve(tx);
    });
}

function fetchToken(endpoint, tx, userSecret) {
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
      Promise.resolve(response.text());
    }

    response.json().then(json => Promise.reject(new Error(json.error)));
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

export { Challenge, Sign, Token, fetchChallenge, verifyToken, fetchToken };
