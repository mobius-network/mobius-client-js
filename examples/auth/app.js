$(function() {
  var xdr = null
  var signedXdr = null
  var keypair = StellarSdk.Keypair.random();

  StellarSdk.Network.useTestNetwork()

  $('#public_key').val(keypair.publicKey());
  $('#secret').val(keypair.secret());

  $('#challenge').on('click', function() {
    MobiusClient.Auth.fetchChallenge("/auth", "GCDKKHKJLLREGJHHJVLPCIM2N2F55IADTBSD3JCM47JDEPFO4VGG2RXN")
      .then(challenge => {
        $('#challenge_xdr').val(challenge.toEnvelope().toXDR('base64'));
      })
      .catch(error => {
        $("#result").html(error.message);
      });
  });

  $('#sign').on('click', function() {
    var tx = new StellarSdk.Transaction(xdr);
    tx.sign(keypair);
    signedXdr = tx.toEnvelope().toXDR("base64");
    $('#signed_challenge_xdr').val(signedXdr);

    axios({
      url: '/auth',
      method: 'post',
      params: {
        xdr: signedXdr,
        public_key: keypair.publicKey()
      }
    }).then(function(response) {
      $('#result').html(response.data)
    });
  })
})
