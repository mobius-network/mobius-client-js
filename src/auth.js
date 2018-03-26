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

  return tx;
};

let fetchChallenge = ((endpoint, appPublicKey) => {
  let url = URI(endpoint);
  let keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);

  let promise = new Promise((resolve, reject) => {
    fetch(url.toString())
      .then(response => {
        //let tx = new StellarSdk.Transaction(response.text());
        console.log(response);
        console.log("X");
        // if (!keypair.verify(tx, tx.signatures[0])) {
        //   reject(new Error("Wrong challenge transaction signature"));
        // } else {
        //   resolve(tx);
        // }
      });
  });

  return promise;
});

let fetchToken = ((endpoint, tx, userSecret) => {
  let url = URI(endpoint);
  let keypair = StellarSdk.Keypair.fromSecret(userSecret);

});

export { generateChallenge, fetchChallenge, fetchToken };
