/* eslint-disable import/prefer-default-export */
/**
 * @param {Transaction} tx - Transaction to verify
 * @param {Keypair} keypair - Keypair object for given Developer public key
 * @returns {boolean} if given transaction is signed using specified keypair
 */
export function verify(tx, keypair) {
  const { signatures } = tx;
  const hash = tx.hash();

  if (!signatures || signatures.length === 0) {
    return false;
  }

  return signatures.some(signature =>
    keypair.verify(hash, signature.signature())
  );
}
