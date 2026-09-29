const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf-8');

code = code.replace(
`export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await verify(session)
}`,
`export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return { error: 'No cookie found' };
  const verified = await verify(session);
  if (!verified) return { error: 'Verification failed' };
  return verified;
}`
);

fs.writeFileSync('src/lib/auth.ts', code);
