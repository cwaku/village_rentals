export function ok(res, data) {
  res.status(200).json(data);
}

export function created(res, data) {
  res.status(201).json(data);
}

export function badRequest(res, message) {
  res.status(400).json({ error: message });
}

export function notFound(res, message = 'Not found') {
  res.status(404).json({ error: message });
}
