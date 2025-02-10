type SortBy = 'CREATED_AT' | 'COMPLETED_AT';
type ExecutionStatus = 'PENDING' | 'RUNNING' | 'CANCELED' | 'FAILED' | 'SUCCEEDED';

export interface QuerySearch {
	query_id: string;
	query_hash: string;
	limit?: number;
	sort_by?: SortBy;
	statuses?: ExecutionStatus[];
}

export interface Execution {
	id: number;
	query_id: string;
	query_hash: string;
	created_at: string;
	query: string;
	status: ExecutionStatus;
	picked_at?: string;
	progress?: Progress;
	completed_at?: string;
	result?: ProxyResult;
	error?: string;
}

export interface ExecutionWithResultURL extends Omit<Execution, 'created_at'> {
	result_url: string;
	created_at: Date;
}

interface Progress {
	rows: number;
	bytes: number;
	total_rows: number;
	elapsed: number;
}

export interface ProxyResult {
	meta: Array<ColumnDescriptor>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Array<{ [key: string]: any }>;
	rows: number;
}

export interface ColumnDescriptor {
	name: string;
	type: string;
}
