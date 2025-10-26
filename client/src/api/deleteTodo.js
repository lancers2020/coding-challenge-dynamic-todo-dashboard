/**
 * Delete a todo by key from the API.
 *
 * @param {Object} [options]
 * @param {string} options.key The exact key for the todo (e.g. 'todos:MyTask123').
 * @param {string} [options.baseUrl] Base URL for the API (defaults to http://localhost:4000).
 * @returns {Promise<any>} Parsed JSON response from the server.
 */
export async function deleteTodo({ key, baseUrl = 'http://localhost:4000' } = {}) {
  if (!key) throw new Error('deleteTodo requires a `key` string');

  const trimmedBase = baseUrl.replace(/\/$/, '');
  const url = `${trimmedBase}/api/todos`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    let bodyText;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = res.statusText || '';
    }
    throw new Error(`DELETE ${url} failed: ${res.status} ${bodyText}`);
  }

  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
  }
}

export default deleteTodo;
