const API_URL = "http://127.0.0.1:5000/api";

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Giriş yapılamadı");
  }

  return data;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Oturum doğrulanamadı");
  }

  return response.json();
}
export async function register(name, email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Kayıt oluşturulamadı");
  }

  return data;
}
export async function getApartments(token) {
  const response = await fetch(
    `${API_URL}/apartments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Apartmanlar alınamadı"
    );
  }

  return data;
}


export async function createApartment(token, apartment) {
  const response = await fetch(
    `${API_URL}/apartments`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(apartment),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Apartman oluşturulamadı"
    );
  }

  return data;
}