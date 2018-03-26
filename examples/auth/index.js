const StellarSdk = require('stellar-sdk')
const MobiusClient = require('../../lib');

const express = require('express')
const app = express()
const PORT = 3000
const keypair = StellarSdk.Keypair.random()

StellarSdk.Network.useTestNetwork();

app.set('view engine', 'ejs')
app.set('views', 'examples/auth')

console.log(`App Public Key: ${keypair.publicKey()}`)

app.use(express.static('examples/auth'))
app.use(express.static('dist'))

app.get('/', (req, res) => {
  res.render('index', { publicKey: keypair.publicKey() })
})

app.get('/auth', (req, res) => {
  res.send(
    MobiusClient.Auth.generateChallenge(keypair.secret())
  );
})

app.listen(PORT, () => console.log(`Auth example app is listening on port ${PORT}!`))
