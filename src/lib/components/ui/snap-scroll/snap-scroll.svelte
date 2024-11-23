<script lang="ts">
	import { onMount } from 'svelte';
	import { Typography } from '$lib/components/ui/typography';
	import { Section } from '$lib/components/ui/snap-scroll';

	let sections = [
		{ id: 1, color: 'bg-primary', content: 'Section 1' },
		{ id: 2, color: 'bg-blue-500', content: 'Section 2' },
		{ id: 3, color: 'bg-green-500', content: 'Section 3' },
		{ id: 4, color: 'bg-yellow-500', content: 'Section 4' }
	];

	let currentSection = $state(1);
	let container: HTMLElement;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const target = entry.target as HTMLElement;
						currentSection = parseInt(target.dataset.id ?? '1');
					}
				});
			},
			{ threshold: 0.7 }
		);

		document.querySelectorAll('.section').forEach((section) => {
			observer.observe(section);
		});

		return () => observer.disconnect();
	});

	function scrollToSection(id: number) {
		const section = document.querySelector(`.section[data-id="${id}"]`);
		if (section) {
			section.scrollIntoView({
				behavior: 'smooth'
			});
		}
	}
</script>

<div class="snap-container" bind:this={container}>
	{#each sections as section (section.id)}
		<Section id={section.id} color={section.color} active={currentSection === section.id}>
			<Typography variant="h1">{section.content}</Typography>
		</Section>
	{/each}
</div>

<nav class="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
	{#each sections as section (section.id)}
		<button
			class="w-3 h-3 mb-2 rounded-full transition-all duration-300 ease-in-out {currentSection ===
			section.id
				? 'bg-white scale-125'
				: 'bg-gray-400 hover:bg-gray-200'}"
			onclick={() => scrollToSection(section.id)}
			aria-label={`Scroll to section ${section.id}`}
		></button>
	{/each}
</nav>

<style>
	.snap-container {
		height: 100vh;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.snap-container::-webkit-scrollbar {
		display: none;
	}
</style>
