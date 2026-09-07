async function handleResponse(res: Response) {
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || text || res.statusText);
    return data;
  } catch (err) {
    if (!res.ok) throw new Error(text || res.statusText);
    return {};
  }
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function saveAnalysis(payload: { type: string; cvText: string; jobDescription: string; analysis?: any; rewrittenCv?: string }) {
  const res = await fetch('/api/analysis/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchAnalyses() {
  const res = await fetch('/api/analysis', { headers: { ...authHeaders() } });
  return handleResponse(res);
}
