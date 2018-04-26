$(function() {
  var tx = null
  var keypair = StellarSdk.Keypair.random();

  StellarSdk.Network.useTestNetwork()

  $('#public_key').val(keypair.publicKey());
  $('#secret').val(keypair.secret());

  $('#challenge').on('click', function() {
    axios
      .get("/auth")
      .then(response => {
        console.log(response);
        xdr = response.data;
        $("#challenge_xdr").val(xdr);
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
