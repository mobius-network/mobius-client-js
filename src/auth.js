import 'whatwg-fetch';
import { Promise } from 'es6-promise';
import URI from 'urijs';
import StellarSdk from 'stellar-sdk';

const randomSequence = () => (99999999 - Math.floor(Math.random() * 65536)).toString();

const buildTimeBounds = () => new StellarSdk.xdr.TimeBounds({
  minTime: new Date().getTime(),
  maxTime: new Date().getTime() + 3600,
});

const generateChallenge = (developerSecret) => {
  const keypair = StellarSdk.Keypair.fromSecret(developerSecret);
  const account = new StellarSdk.Account(keypair.publicKey(), randomSequence());

  const tx = new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.payment({
      account: StellarSdk.Keypair.random(),
      destination: keypair.publicKey(),
      sequence: randomSequence(),
      amount: '0.000001',
      asset: StellarSdk.Asset.native(),
      memo: 'Mobius authentication',
      timeBounds: buildTimeBounds(),
    }))
    .build();

  tx.sign(keypair);
  return tx.toEnvelope().toXDR('base64');
};

const fetchChallenge = (endpoint, appPublicKey) => {
  const url = URI(endpoint);
  const keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);

  const promise = new Promise((resolve, reject) => {
    fetch(url.toString())
      .then(response => response.text())
      .then((body) => {
        const tx = new StellarSdk.Transaction(body);
        if (!keypair.verify(tx.hash(), tx.signatures[0].signature())) {
          return reject(new Error('Wrong challenge transaction signature'));
        }

        return resolve(tx);
      });
  });

  return promise;
};

const fetchToken = (endpoint, tx, userSecret) => new Promise((resolve, reject) => {
  const url = URI(endpoint);
  const keypair = StellarSdk.Keypair.fromSecret(userSecret);

  tx.sign(keypair);

  const xdr = tx.toEnvelope().toXDR('base64');

  return fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      xdr,
      public_key: keypair.publicKey(),
    }),
  })
    .then((response) => {
      if (response.ok) {
        return resolve(response.text());
      }

      response.json()
        .then(json => reject(new Error(json.error)));
    });
});

const verifyToken = (xdr, userPublicKey, appSecret) => new Promise((resolve, reject) => {
  const tx = new StellarSdk.Transaction(xdr);
  const userKeypair = StellarSdk.Keypair.fromPublicKey(userPublicKey);
  const appKeypair = StellarSdk.Keypair.fromSecret(appSecret);
  const appVerified = appKeypair.verify(tx.hash(), tx.signatures[0].signature());
  const userVerified = userKeypair.verify(tx.hash(), tx.signatures[1].signature());

  if ((!appVerified) || (!userVerified)) {
    return reject(Error('Signatures invalid'));
  }

  return resolve(tx.hash().toString('hex'));
});

export { generateChallenge, fetchChallenge, verifyToken, fetchToken };
