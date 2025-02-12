import { env } from '$env/dynamic/private';
import { Auth0 } from 'arctic';
import { createRemoteJWKSet, jwtVerify } from 'jose';

if (!env.AUTH0_DOMAIN) throw new Error('AUTH0_DOMAIN is not set');
if (!env.AUTH0_CLIENT_ID) throw new Error('AUTH0_CLIENT_ID is not set');
if (!env.AUTH0_CLIENT_SECRET) throw new Error('AUTH0_CLIENT_SECRET is not set');

export const auth0 = (origin: string) =>
	new Auth0(
		env.AUTH0_DOMAIN,
		env.AUTH0_CLIENT_ID,
		env.AUTH0_CLIENT_SECRET,
		`${origin}/login/callback`
	);

const JWKS = createRemoteJWKSet(new URL(`https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`));

export async function verifyJWT(token: string) {
	await JWKS.reload();

	const { payload } = await jwtVerify(token, JWKS, { issuer: `https://${env.AUTH0_DOMAIN}/` });

	return payload;
}

export function createLogoutURL(idToken: string, redirectTo: string) {
	const url = new URL(`https://${env.AUTH0_DOMAIN}`);
	url.pathname = '/oidc/logout';

	url.searchParams.set('id_token_hint', idToken);
	url.searchParams.set('post_logout_redirect_uri', redirectTo);

	return url;
}
