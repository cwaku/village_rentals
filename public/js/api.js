async function request(method, url, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}


export const api = {
  get:    (url)       => request('GET',    url),
  post:   (url, body) => request('POST',   url, body),
  patch:  (url, body) => request('PATCH',  url, body),
  delete: (url)       => request('DELETE', url),
};
