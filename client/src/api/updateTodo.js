/**
 * Update a todo by key with partial updates.
 *
 * @param {Object} params
 * @param {string} params.key The exact key for the todo (e.g. 'todos:MyTask123').
 * @param {Object} params.updates Partial updates to merge into the todo.
 * @param {string} [params.baseUrl] Base URL for the API (defaults to http://localhost:4000).
 */
export async function updateTodo({ key, updates, baseUrl = 'http://localhost:4000' } = {}) {
  if (!key) throw new Error('updateTodo requires a `key` string');
  if (!updates || typeof updates !== 'object') throw new Error('updateTodo requires an `updates` object');

  const trimmedBase = baseUrl.replace(/\/$/, '');
  const url = `${trimmedBase}/api/todos`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ key, updates }),
  });

  if (!res.ok) {
    let bodyText;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = res.statusText || '';
    }
    throw new Error(`PATCH ${url} failed: ${res.status} ${bodyText}`);
  }

  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
  }
}

export default updateTodo;
