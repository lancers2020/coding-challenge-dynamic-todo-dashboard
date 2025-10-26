/**
 * Fetch todos from the API.
 *
 * @param {Object} [options]
 * @param {string} [options.baseUrl] Base URL for the API (e.g. http://localhost:5000). Defaults to empty string.
 * @param {AbortSignal} [options.signal] Optional AbortSignal to cancel the request.
 * @returns {Promise<any[]>} Resolves with parsed JSON todos on success.
 * @throws {Error} When the fetch fails or the response is not ok.
 */
export async function getTodos({ baseUrl = 'http://localhost:4000', signal } = {}) {
	const trimmedBase = baseUrl.replace(/\/$/, '');
	const url = `${trimmedBase}/api/todos`.replace(/^\//, trimmedBase ? `${trimmedBase}/api/todos` : '/api/todos');

	const res = await fetch(url, {
		method: 'GET',
		headers: { 'Accept': 'application/json' },
		signal,
	});

	if (!res.ok) {
		let bodyText;
		try {
			bodyText = await res.text();
		} catch (e) {
			bodyText = res.statusText || '';
		}
		throw new Error(`GET ${url} failed: ${res.status} ${bodyText}`);
	}

	try {
		return await res.json();
	} catch (e) {
		throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
	}
}

export default getTodos;

