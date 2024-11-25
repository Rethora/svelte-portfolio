<script>
	import '../app.css';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import Typography from '$lib/components/ui/typography/typography.svelte';
	import io from 'socket.io-client';

	let hoveredPortfolio = $state(false);
	let hoveredGame = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

{#if mounted}
	<div in:fade={{ duration: 300 }}>
		<div class="min-h-screen flex flex-col items-center justify-center p-4">
			<div in:fly={{ y: -50, duration: 1000, delay: 300 }}>
				<Typography variant="h1" class="text-5xl font-bold mb-16 text-center">
					Welcome to My Creative Space
				</Typography>
			</div>

			<div class="flex flex-col md:flex-row gap-8 items-center justify-center">
				<a href="/portfolio">
					<div in:fly={{ x: -100, duration: 1000, delay: 500, easing: cubicOut }}>
						<Card.Root
							class="w-full md:w-80 transition-transform duration-200 hover:scale-105"
							onmouseenter={() => (hoveredPortfolio = true)}
							onmouseleave={() => (hoveredPortfolio = false)}
						>
							<Card.Header>
								<Card.Title><Typography variant="h2">Portfolio</Typography></Card.Title>
							</Card.Header>
							<Card.Content class="relative p-8 text-center">
								{#if hoveredPortfolio}
									<div class="absolute inset-0 rounded-xl" transition:fade></div>
								{/if}
								<p class="text-gray-300">Explore my professional work and projects</p>
							</Card.Content>
						</Card.Root>
					</div>
				</a>

				<a href="/game">
					<div in:fly={{ x: 100, duration: 1000, delay: 500, easing: cubicOut }}>
						<Card.Root
							class="w-full md:w-80 transition-transform duration-200 hover:scale-105"
							onmouseenter={() => (hoveredGame = true)}
							onmouseleave={() => (hoveredGame = false)}
						>
							<Card.Header>
								<Card.Title><Typography variant="h2">Interactive</Typography></Card.Title>
							</Card.Header>
							<Card.Content class="relative p-8 text-center">
								{#if hoveredGame}
									<div class="absolute inset-0 rounded-xl" transition:fade></div>
								{/if}
								<p class="text-gray-300">Try the gamified version of my portfolio</p>
							</Card.Content>
						</Card.Root>
					</div>
				</a>
			</div>
		</div>
	</div>
{/if}
