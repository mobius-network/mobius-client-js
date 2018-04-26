$(function() {
  var xdr = null;
  var signedXDR = null;
  var keypair = StellarSdk.Keypair.random();
  var appPublicKey = $("#appPublicKey").val();

  StellarSdk.Network.useTestNetwork();

  $("#public_key").val(keypair.publicKey());
  $("#secret").val(keypair.secret());

  $("#challenge").on("click", () => {
    axios
      .get("/auth")
      .then(response => {
        xdr = response.data;
        $("#challenge_xdr").val(xdr);
      })
      .catch(err => {
        $("#result").html(err.message);
      });
  });

  $("#sign").on("click", () => {
    signedXDR = MobiusClient.Auth.Sign.call(
      keypair.secret(),
      xdr,
      appPublicKey
    );

    $("#signed_challenge_xdr").val(signedXDR);

    axios({
      url: "/auth",
      method: "post",
      params: {
        xdr: signedXDR,
        public_key: keypair.publicKey()
      }
    })
      .then(response => {
        $("#result").html(response.data);
      })
      .catch(err => {
        $("#result").html(err.message);
      });
  });
});
