<script lang="ts">
	import { buildInfo } from '$lib/buildInfo';

	function formatDate(isoString: string) {
		return new Date(isoString).toLocaleDateString();
	}

	function formatTime(isoString: string) {
		return new Date(isoString).toLocaleTimeString();
	}
</script>

<footer>
	<p>
		PrivaSend v{buildInfo.version} • Built {formatDate(buildInfo.buildDate)} at {formatTime(
			buildInfo.buildDate
		)}
	</p>
</footer>

<style>
	footer {
		text-align: center;
		margin-top: 2rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.85rem;
	}

	footer p {
		margin: 0;
	}
</style>
