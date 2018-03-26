import "whatwg-fetch";
import { Promise } from "es6-promise";
import URI from "urijs";

let fetchChallenge = ((endpoint, appPublicKey) => {
  let url = URI(endpoint);
  let keypair = StellarSdk.Keypair.fromPublicKey(appPublicKey);
  let promise = new Promise((resolve, reject) => {
    fetch(url.toString())
      .then(response => {
        let tx = new StellarSdk.Transaction(response.text());
        if (!keypair.verify(tx, tx.signatures[0])) {
          reject(new Error("Wrong challenge transaction signature"));
        } else {
          resolve(tx);
        }
      });
  });

  return promise;
});

let fetchToken = ((endpoint, tx, userSecret) => {
  let url = URI(endpoint);
  let keypair = StellarSdk.Keypair.fromSecret(userSecret);

});

export { fetchChallenge };
