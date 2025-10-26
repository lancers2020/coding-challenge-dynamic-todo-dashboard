/**
 * Post a new todo to the API.
 *
 * @param {Object} [options]
 * @param {Object} options.todo The todo payload to send (will be JSON.stringified).
 * @param {string} [options.baseUrl] Base URL for the API (e.g. http://localhost:5000). Defaults to empty string.
 * @param {AbortSignal} [options.signal] Optional AbortSignal to cancel the request.
 * @returns {Promise<any>} Resolves with parsed JSON response on success.
 * @throws {Error} When the fetch fails or the response is not ok.
 */
export async function postTodo({ todo, baseUrl = 'http://localhost:4000', signal } = {}) {
    console.log(':::postTodo todo', todo);
	if (typeof todo === 'undefined') {
		throw new Error('postTodo requires a `todo` object');
	}

	const trimmedBase = baseUrl.replace(/\/$/, '');
	const url = `${trimmedBase}/api/todos`.replace(/^\//, trimmedBase ? `${trimmedBase}/api/todos` : '/api/todos');

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json'},
		body: JSON.stringify(todo),
		signal,
	});

	if (!res.ok) {
		let bodyText;
		try {
			bodyText = await res.text();
		} catch (e) {
			bodyText = res.statusText || '';
		}
		throw new Error(`POST ${url} failed: ${res.status} ${bodyText}`);
	}

	try {
		return await res.json();
	} catch (e) {
		throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
	}
}

export default postTodo;

