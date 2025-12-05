<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	let { url, size = 200 }: { url: string; size?: number } = $props();

	let canvas: HTMLCanvasElement | undefined = $state(undefined);

	onMount(() => {
		if (canvas && url) {
			QRCode.toCanvas(canvas, url, { width: size, margin: 2 }, (error) => {
				if (error) console.error('QR Code generation failed:', error);
			});
		}
	});

	$effect(() => {
		if (canvas && url) {
			QRCode.toCanvas(canvas, url, { width: size, margin: 2 }, (error) => {
				if (error) console.error('QR Code generation failed:', error);
			});
		}
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		display: block;
		border-radius: 0.5rem;
	}
</style>
