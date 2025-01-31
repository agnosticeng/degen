// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	type Prettify<T> = { [K in keyof T]: T[K] } & {};
	type MakeOptional<T, K extends keyof T> = Prettify<Partial<Pick<T, K>> & Omit<T, K>>;
}

export {};
