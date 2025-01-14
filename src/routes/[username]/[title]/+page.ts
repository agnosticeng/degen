import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	console.log(params.id);

	return {
		query: {
			id: 'a2x9f',
			title: 'Ethereum Price',
			date: new Date(),
			author: 'didierfranc',
			likes: 111
		}
	};
};
