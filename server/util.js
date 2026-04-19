export const ok = (res, data) => {
  res.status(200).json(data);
};

export const created = (res, data) => {
  res.status(201).json(data);
};

export const badRequest = (res, message) => {
  res.status(400).json({ error: message });
};

export const notFound = (res, message = 'Not found') => {
  res.status(404).json({ error: message });
};
