<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Navbar } from '$lib/components/ui/navbar';
	import '../app.css';
	let { children } = $props();
</script>

<div>
	<ModeWatcher />
	<Navbar />
	{@render children()}
</div>

<style lang="postcss">
	:global(html) {
		background-color: var(--background);
		color-scheme: dark;
	}

	:global(body) {
		margin: 0 !important;
		padding: 0 !important;
	}
</style>
