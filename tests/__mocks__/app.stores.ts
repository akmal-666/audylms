import { readable } from 'svelte/store';

export const page = readable({
	url: new URL('http://localhost:5173/dashboard'),
	params: {},
	route: { id: '/(app)/dashboard' },
	status: 200,
	error: null,
	data: {},
	form: null,
	state: {}
});

export const navigating = readable(null);
export const updated = readable(false);
