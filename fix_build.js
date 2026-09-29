const fs = require('fs');

let authCode = fs.readFileSync('src/lib/auth.ts', 'utf-8');

authCode = authCode.replace(
`  } catch (_error: any) {
    console.error("JWT verify error:", _error);
    return { verify_failed: true, error_message: _error.message || String(_error) };
  }`,
`  } catch (_error) {
    console.error("JWT verify error:", _error);
    return null;
  }`
);

authCode = authCode.replace(
`export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return { error: 'No cookie found' };
  const verified = await verify(session) as any;
  if (verified?.verify_failed) return { error: 'Verification failed: ' + verified.error_message };
  return verified;
}`,
`export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await verify(session)
}`
);

fs.writeFileSync('src/lib/auth.ts', authCode);
