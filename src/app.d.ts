// See https://svelte.dev/docs/kit/types#app.d.ts

import type { User } from '$lib/server/repositories/users';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: User | null;
			authenticated: boolean;
		}
		// interface PageData {}
		interface PageState {
			searchBar?: boolean;
		}
		// interface Platform {}
	}

	type Prettify<T> = { [K in keyof T]: T[K] } & {};
	type MakeOptional<T, K extends keyof T> = Prettify<Partial<Pick<T, K>> & Omit<T, K>>;
	type MakeRequired<T, K extends keyof T> = Prettify<Required<Pick<T, K>> & Omit<T, K>>;
}

export {};
