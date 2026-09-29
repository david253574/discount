const fs = require('fs');
let code = fs.readFileSync('src/lib/ably.ts', 'utf-8');

code = code.replace(
`export async function createTokenRequest(
  channel: string,
  clientId: string,
): Promise<Ably.TokenRequest> {
  const rest = getAblyRest();
  if (!rest) throw new Error('Ably is not configured');

  return rest.auth.createTokenRequest({`,
`export async function createTokenRequest(
  channel: string,
  clientId: string,
): Promise<Ably.TokenDetails> {
  const rest = getAblyRest();
  if (!rest) throw new Error('Ably is not configured');

  return rest.auth.requestToken({`
);

fs.writeFileSync('src/lib/ably.ts', code);
