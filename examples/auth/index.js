const StellarSdk = require('stellar-sdk')
const MobiusClient = require('../../lib');

const express = require('express')
const app = express()
const PORT = 3000
const keypair = StellarSdk.Keypair.random()

console.log(`APP PUBLIC KEY: ${keypair.publicKey()}`)

app.use(express.static('examples/auth'))
app.use(express.static('dist'))

app.get('/auth', (req, res) => {
  res.send(
    MobiusClient.Auth.generateChallenge(keypair.secret())
  );
})

app.listen(PORT, () => console.log(`Auth example app is listening on port ${PORT}!`))
