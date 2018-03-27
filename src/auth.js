import "whatwg-fetch";
import { Promise } from "es6-promise";
import URI from "urijs";
import StellarSdk from 'stellar-sdk';

let randomSequence = () => {
  return (99999999 - Math.floor(Math.random() * 65536)).toString();
};

let buildTimeBounds = () => {
  return new StellarSdk.xdr.TimeBounds({
    minTime: new Date().getTime(),
    maxTime: new Date().getTime() + 3600
  });
};

let generateChallenge = (developerSecret) => {
  let keypair = StellarSdk.Keypair.fromSecret(developerSecret);
  let account = new StellarSdk.Account(keypair.publicKey(), randomSequence());

  let tx = new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.payment({
      account: StellarSdk.Keypair.random(),
      destination: keypair.publicKey(),
      sequence: randomSequence(),
      amount: "0.000001",
      asset: StellarSdk.Asset.native(),
      memo: "Mobius authentication",
      timeBounds: buildTimeBounds()
    }))
    .build();

  tx.sign(keypair);
  return tx.toEnvelope().toXDR('base64');
};

let fetchChallenge = (endpoint, appPublicKey) => {
  let url = URI(endpoint);
  let keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);

  let promise = new Promise((resolve, reject) => {
    fetch(url.toString())
      .then(response => {
        return response.text();
      })
      .then(body => {
        let tx = new StellarSdk.Transaction(body);
        if (!keypair.verify(tx.hash(), tx.signatures[0].signature())) {
          return reject(new Error("Wrong challenge transaction signature"));
        } else {
          return resolve(tx);
        }
      });
  });

  return promise;
};

let fetchToken = (endpoint, tx, userSecret) => {
  return new Promise((resolve, reject) => {
    let url = URI(endpoint);
    let keypair = StellarSdk.Keypair.fromSecret(userSecret);

    tx.sign(keypair);

    let xdr = tx.toEnvelope().toXDR('base64');

    return fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xdr: xdr,
        public_key: keypair.publicKey()
      })
    })
    .then(response => {
      if (response.ok) {
        return resolve(response.text());
      }

      response.json()
        .then(json => { return reject(new Error(json.error)); });
    });
  });
};

let verifyToken = (xdr, userPublicKey, appSecret) => {
  return new Promise((resolve, reject) => {
    let tx = new StellarSdk.Transaction(xdr);
    let userKeypair = StellarSdk.Keypair.fromPublicKey(userPublicKey);
    let appKeypair = StellarSdk.Keypair.fromSecret(appSecret);
    let appVerified = appKeypair.verify(tx.hash(), tx.signatures[0].signature());
    let userVerified = userKeypair.verify(tx.hash(), tx.signatures[1].signature());
    
    if ((!appVerified) || (!userVerified)) {
      return reject(Error("Signatures invalid"));
    }

    return resolve(tx.hash().toString("hex"));
  });
};

export { generateChallenge, fetchChallenge, verifyToken, fetchToken };
