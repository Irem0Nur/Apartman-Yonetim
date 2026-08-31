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
export async function getUnits(token, apartmentId) {
  const response = await fetch(
    `${API_URL}/units/apartment/${apartmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Daireler alınamadı");
  }

  return data;
}

export async function createUnit(token, unit) {
  const response = await fetch(`${API_URL}/units`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(unit),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Daire oluşturulamadı");
  }

  return data;
}

export async function updateUnit(token, unitId, unit) {
  const response = await fetch(`${API_URL}/units/${unitId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(unit),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Daire güncellenemedi");
  }

  return data;
}

export async function deleteUnit(token, unitId) {
  const response = await fetch(`${API_URL}/units/${unitId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Daire silinemedi");
  }

  return data;
}
export async function getPeople(
  token,
  apartmentId
) {
  const response = await fetch(
    `${API_URL}/people/apartment/${apartmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Kişiler alınamadı"
    );
  }

  return data;
}


export async function createPerson(
  token,
  person
) {
  const response = await fetch(
    `${API_URL}/people`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(person),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Kişi eklenemedi"
    );
  }

  return data;
}


export async function updatePerson(
  token,
  relationId,
  person
) {
  const response = await fetch(
    `${API_URL}/people/${relationId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(person),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Kişi güncellenemedi"
    );
  }

  return data;
}


export async function deletePerson(
  token,
  relationId
) {
  const response = await fetch(
    `${API_URL}/people/${relationId}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Kişi silinemedi"
    );
  }

  return data;
}