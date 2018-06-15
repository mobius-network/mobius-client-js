[![npm version](https://badge.fury.io/js/%40mobius-network%2Fmobius-client-js.svg)](https://badge.fury.io/js/%40mobius-network%2Fmobius-client-js)
[![Build Status](https://travis-ci.org/mobius-network/mobius-client-js.svg?branch=master)](https://travis-ci.org/mobius-network/mobius-client-js)

# mobius-client-js

# Mobius DApp Store JS SDK

The Mobius DApp Store JS SDK makes it easy to integrate Mobius DApp Store MOBI payments into any JS application.

A big advantage of the Mobius DApp Store over centralized competitors such as the Apple App Store or Google Play Store is significantly lower fees - currently 0% compared to 30% - for in-app purchases.

## DApp Store Overview

The Mobius DApp Store will be an open-source, non-custodial "wallet" interface for easily sending crypto payments to apps. You can think of the DApp Store like https://stellarterm.com/ or https://www.myetherwallet.com/ but instead of a wallet interface it is an App Store interface.

The DApp Store is non-custodial meaning Mobius never holds the secret key of either the user or developer.

An overview of the DApp Store architecture is:

- Every application holds the private key for the account where it receives MOBI.
- An application specific unique account where a user deposits MOBI for use with the application is generated for each app based on the user's seed phrase.
- When a user opens an app through the DApp Store:
  1) Adds the application's public key as a signer so the application can access the MOBI and
  2) Signs a challenge transaction from the app with its secret key to authenticate that this user owns the account. This prevents a different person from pretending they own the account and spending the MOBI (more below under Authentication).

## Installation

Using Yarn or npm:

```sh
$ yarn add @mobius-network/mobius-client-js
```

or

```
$ npm install --save @mobius-network/mobius-client-js
```

## Mobius CLI

Add this line to your application's Gemfile:

```ruby
gem 'mobius-client'
```

And then execute:

    $ bundle

Or install it yourself with:

    $ gem install mobius-client

### Setting up the developer's application account

Run:

    $ mobius-cli create dapp-account

Creates a new Stellar account with 1,000 test-net MOBI.

You can also obtain free test network MOBI from https://mobius.network/friendbot

### Setting up test user accounts

1. Create an empty Stellar account without a MOBI trustline.
    ```
      $ mobius-cli create account
    ```
2. Create a stellar account with 1,000 test-net MOBI
    ```
      $ mobius-cli create dapp-account
    ```
3. Create a stellar account with 1,000 test-net MOBI and the specified application public key added as a signer
    ```
      $ mobius-cli create dapp-account -a <Your application public key>
    ```

### Account Creation Wizard

The below command will create and setup the 4 account types above for testing and generate a simple HTML test interface that simulates the DApp Store authentication functionality (obtaining a challenge request from an app, signing it, and then opening the specified app passing in a JWT encoded token the application will use to verify this request is from the user that owns the specified MOBI account).

```
  $ mobius-cli create dev-wallet
```

## Production Server Setup

Your production server must use HTTPS and set the below header on the `/auth` endpoint:

`Access-Control-Allow-Origin: *`

## Authentication

### Explanation

When a user opens an app through the DApp Store it tells the app what Mobius account it should use for payment.

The application needs to ensure that the user actually owns the secret key to the Mobius account and that this isn't a replay attack from a user who captured a previous request and is replaying it.

This authentication is accomplished through the following process:

* When the user opens an app in the DApp Store it requests a challenge from the application.
* The challenge is a payment transaction of 1 XLM from and to the application account. It is never sent to the network - it is just used for authentication.
* The application generates the challenge transaction on request, signs it with its own private key, and sends it to user.
* The user receives the challenge transaction and verifies it is signed by the application's secret key by checking it against the application's published public key (that it receives through the DApp Store). Then the user signs the transaction with its own private key and sends it back to application along with its public key.
* Application checks that challenge transaction is now signed by itself and the public key that was passed in. Time bounds are also checked to make sure this isn't a replay attack. If everything passes the server replies with a token the application can pass in to "login" with the specified public key and use it for payment (it would have previously given the app access to the public key by adding the app's public key as a signer).

Note: the challenge transaction also has time bounds to restrict the time window when it can be used.

See demo at:

```bash
$ git clone git@github.com/mobius-network/mobius-client-js.git

$ cd mobius-client-js

$ yarn install

$ yarn run example:auth
```

### Sample Server Implementation

Using express.js:

```js
const express = require("express");
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// GET /auth
// Generates and returns challenge transaction XDR signed by application to user
app.get("/auth", (req, res) => {
  res.send(
    MobiusClient.Auth.Challenge.call(
      APPLICATION_SECRET_KEY         // SA2VTRSZPZ5FIC.....I4QD7LBWUUIK
    )
  );
});

// POST /auth
// Validates challenge transaction. It must be:
//  - Signed by application and requesting user.
//  - Not older than 10 seconds from now (see MobiusClient.Client.strictInterval`)
app.post("/auth", (req, res) => {
  try {
    const token = new MobiusClient.Auth.Token(
      APPLICATION_SECRET_KEY,       // SA2VTRSZPZ5FIC.....I4QD7LBWUUIK
      req.query.xdr,                // Challnge transaction
      req.query.public_key          // User's public key
    );

    // Important! Otherwise, token will be considered valid.
    token.validate();

    // Converts issued token into hash and sends it to user
    res.send(token.hash("hex"));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(process.env.PORT);
```

## Instantiating App
Once the user is authenticated, they are rerouted to the app URL. The next step is creating an APP instance for the application to interact with. The following snippet is a brief example.

```js 
/**
 * @param {string} developerSecret - App developer secret key
 * @param {string} userPublic - User public key
 * @returns {Promise}
 */
new MobiusClient.AppBuilder.build(developerSecret, userPublic)
  .then(rsp => { 
    APP = rsp; 
  };
```

## Account Details

### App Account
The following methods are used to get details about the app account.
```js
// returns app account details
APP.appAccount

// returns app account balance
APP.appBalance

// StellarSdk.Keypair object for app
APP.appKeypair
```

### User Accounts
The following methods are used to get details about the current user account.

```js
// Boolean - true if developer is authorized to use an application
APP.authorized

// returns user account details
APP.userAccount

// returns user account balance
APP.userBalance

// returns StellarSdk.Keypair object for user
APP.userKeypair
```

## Payment

### Explanation

After the user completes the authentication process they have a token. They now pass it to the application to "login" which tells the application which Mobius account to withdraw MOBI from (the user public key) when a payment is needed. For a web application the token is generally passed in via a `token` request parameter. Upon opening the website/loading the application it checks that the token is valid (within time bounds etc) and the account in the token has added the app as a signer so it can withdraw MOBI from it.

#### Methods

The following methods are used to transact between the app and user. `charge` is used to charge a user account and optionally transfer to a third party account. `payout` is used to send a payment from the application account to a user or third party. `transfer` is used to transact between the user and a third party directly (eg. user to user).

```js
/**
 * Charges specified amount from user account and then optionally transfers
 * it from app account to a third party in the same transaction.
 * @param {number} amount - Payment amount
 * @param {?string} [destination] - optional third party receiver address
 * @returns {Promise}
 */
APP.charge(amount, destination).then(rsp => {...});

/**
 * Sends money from the application account to the user or third party.
 * @param {number} amount - Payment amount
 * @param {string} [destination] - third party receiver address
 * @returns {Promise}
 */
APP.payout(amount, destination).then(rsp => {...});

/**
 * Sends money from the user account to the third party directly.
 * @param {number} amount - Payment amount
 * @param {string} destination - third party receiver address
 * @returns {Promise}
 */
APP.transfer(amount, destination).then(rsp => {...})
```

## Development

``` sh

# Clone this repo
$ git clone git@github.com/mobius-network/mobius-client-js.git && cd $_

# Install dependencies
$ yarn install

# Watch files for changes with recompile in development mode
$ yarn run development

# Run live authentification example
$ yarn run example:auth

# Build for production with minification
$ yarn run build
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/mobius-network/mobius-client-js. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the Mobius::Client project’s codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/mobius-network/mobius-client-js/blob/master/CODE_OF_CONDUCT.md).
