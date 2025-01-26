export interface Block {
	id: string;
	type: 'sql' | 'markdown';
	input: string;
}
