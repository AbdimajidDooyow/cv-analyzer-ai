type User = { id: string; email: string; full_name?: string | null };

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

export async function signup(email: string, password: string, full_name?: string): Promise<{ token: string; user: User }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  const data = await handleResponse(res);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function signin(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function signout() {
  localStorage.removeItem('token');
}

export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  try {
    const data = await handleResponse(res);
    return data.user || null;
  } catch (err) {
    localStorage.removeItem('token');
    return null;
  }
}
