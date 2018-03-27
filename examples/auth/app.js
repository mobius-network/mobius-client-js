$(function() {
  var tx = null
  var keypair = StellarSdk.Keypair.random();

  StellarSdk.Network.useTestNetwork()

  $('#public_key').val(keypair.publicKey());
  $('#secret').val(keypair.secret());

  $('#challenge').on('click', function() {
    MobiusClient.Auth.fetchChallenge("/auth", $("#appPublicKey").val())
      .then(challenge => {
        tx = challenge;
        $('#challenge_xdr').val(challenge.toEnvelope().toXDR('base64'));
      })
      .catch(err => {
        $("#result").html(err.message);
      });
  });

  $('#sign').on('click', function() {
    MobiusClient.Auth.fetchToken("/auth", tx, keypair.secret())
      .then(body => {
        $('#result').html(body);
      })
      .catch(err => {
         $('#result').html(err.message);
      });
  });
})
