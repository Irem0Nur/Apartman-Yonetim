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
    throw new Error(
      data.message || "Daireler alınamadı"
    );
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
    throw new Error(
      data.message || "Daire oluşturulamadı"
    );
  }

  return data;
}

export async function updateUnit(token, unitId, unit) {
  const response = await fetch(
    `${API_URL}/units/${unitId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(unit),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Daire güncellenemedi"
    );
  }

  return data;
}

export async function deleteUnit(token, unitId) {
  const response = await fetch(
    `${API_URL}/units/${unitId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Daire silinemedi"
    );
  }

  return data;
}

export async function getPeople(token, apartmentId) {
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
      data.message || "Kişiler alınamadı"
    );
  }

  return data;
}

export async function createPerson(token, person) {
  const response = await fetch(
    `${API_URL}/people`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(person),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Kişi eklenemedi"
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
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(person),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Kişi güncellenemedi"
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
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Kişi silinemedi"
    );
  }

  return data;
}

export async function getDues(
  token,
  apartmentId,
  year,
  month
) {
  const params = new URLSearchParams();

  if (year) {
    params.set("year", year);
  }

  if (month) {
    params.set("month", month);
  }

  const response = await fetch(
    `${API_URL}/dues/apartment/${apartmentId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Aidatlar alınamadı"
    );
  }

  return data;
}

export async function generateDues(
  token,
  apartmentId,
  year,
  month
) {
  const response = await fetch(
    `${API_URL}/dues/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apartment_id: apartmentId,
        year,
        month,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Aidatlar oluşturulamadı"
    );
  }

  return data;
}

export async function getDuePayments(token, dueId) {
  const response = await fetch(
    `${API_URL}/payments/due/${dueId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Ödemeler alınamadı"
    );
  }

  return data;
}


export async function createPayment(
  token,
  payment
) {
  const response = await fetch(
    `${API_URL}/payments`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payment),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Ödeme kaydedilemedi"
    );
  }

  return data;
}


export async function deletePayment(
  token,
  paymentId
) {
  const response = await fetch(
    `${API_URL}/payments/${paymentId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Ödeme silinemedi"
    );
  }

  return data;
}
export async function getPayments(token, apartmentId, year, month) {
  const params = new URLSearchParams();

  if (year) params.append("year", year);
  if (month) params.append("month", month);

  const response = await fetch(
    `${API_URL}/payments/apartment/${apartmentId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ödemeler alınamadı");
  }

  return data;
}

export async function getYearlyPaymentReport(
  token,
  apartmentId,
  year
) {
  const response = await fetch(
    `${API_URL}/payments/yearly-report/${apartmentId}?year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Yıllık ödeme raporu alınamadı"
    );
  }

  return data;
}

export async function getTransactions(
  token,
  apartmentId,
  year,
  month
) {
  const params = new URLSearchParams();

  if (year) {
    params.append("year", year);
  }

  if (month) {
    params.append("month", month);
  }

  const response = await fetch(
    `${API_URL}/transactions/apartment/${apartmentId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Gelir/Gider kayıtları alınamadı"
    );
  }

  return data;
}


export async function createTransaction(
  token,
  transaction
) {
  const response = await fetch(
    `${API_URL}/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transaction),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Kayıt oluşturulamadı"
    );
  }

  return data;
}


export async function deleteTransaction(
  token,
  transactionId
) {
  const response = await fetch(
    `${API_URL}/transactions/${transactionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Kayıt silinemedi"
    );
  }

  return data;
}
export async function getFinancialSummary(
  token,
  apartmentId,
  year,
  month
) {
  const params = new URLSearchParams();

  params.append("year", year);
  params.append("month", month);

  const response = await fetch(
    `${API_URL}/transactions/summary/${apartmentId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Finansal özet alınamadı"
    );
  }

  return data;
}
export async function getCash(
  token,
  apartmentId,
  year,
  month
) {
  const params = new URLSearchParams();

  params.append("year", year);
  params.append("month", month);

  const response = await fetch(
    `${API_URL}/cash/apartment/${apartmentId}?${params.toString()}`,
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
      "Kasa bilgileri alınamadı"
    );
  }

  return data;
}
export async function getDecisions(
  token,
  apartmentId,
  year,
  search = ""
) {
  const params =
    new URLSearchParams();

  if (year) {
    params.append(
      "year",
      year
    );
  }

  if (search) {
    params.append(
      "search",
      search
    );
  }

  const response =
    await fetch(
      `${API_URL}/decisions/apartment/${apartmentId}?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Kararlar alınamadı"
    );
  }

  return data;
}


export async function createDecision(
  token,
  decision
) {
  const response =
    await fetch(
      `${API_URL}/decisions`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            decision
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Karar oluşturulamadı"
    );
  }

  return data;
}


export async function updateDecision(
  token,
  decisionId,
  decision
) {
  const response =
    await fetch(
      `${API_URL}/decisions/${decisionId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            decision
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Karar güncellenemedi"
    );
  }

  return data;
}


export async function deleteDecision(
  token,
  decisionId
) {
  const response =
    await fetch(
      `${API_URL}/decisions/${decisionId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Karar silinemedi"
    );
  }

  return data;
}
export async function getMeetings(
  token,
  apartmentId,
  year,
  search = "",
  status = ""
) {
  const params =
    new URLSearchParams();

  if (year) {
    params.append(
      "year",
      year
    );
  }

  if (search) {
    params.append(
      "search",
      search
    );
  }

  if (status) {
    params.append(
      "status",
      status
    );
  }

  const response =
    await fetch(
      `${API_URL}/meetings/apartment/${apartmentId}?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Toplantılar alınamadı"
    );
  }

  return data;
}


export async function createMeeting(
  token,
  meeting
) {
  const response =
    await fetch(
      `${API_URL}/meetings`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            meeting
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Toplantı oluşturulamadı"
    );
  }

  return data;
}


export async function updateMeeting(
  token,
  meetingId,
  meeting
) {
  const response =
    await fetch(
      `${API_URL}/meetings/${meetingId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            meeting
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Toplantı güncellenemedi"
    );
  }

  return data;
}


export async function deleteMeeting(
  token,
  meetingId
) {
  const response =
    await fetch(
      `${API_URL}/meetings/${meetingId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Toplantı silinemedi"
    );
  }

  return data;
}
export async function updateApartment(
  token,
  apartmentId,
  apartmentData
) {
  const response = await fetch(
    `${API_URL}/apartments/${apartmentId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body:
        JSON.stringify(
          apartmentData
        ),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Apartman bilgileri güncellenemedi"
    );
  }

  return data;
}