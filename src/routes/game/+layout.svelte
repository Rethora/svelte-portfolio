<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import io from 'socket.io-client';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	const socket = io('http://localhost:3000');
	socket.on('eventFromServer', (data) => {
		console.log('data', data);
	});
</script>

{@render children()}
