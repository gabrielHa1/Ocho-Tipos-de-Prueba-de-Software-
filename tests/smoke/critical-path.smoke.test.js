const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body =
    res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, body };
}

describe("Smoke test (verificacion critica post-despliegue)", () => {
  test("el servicio esta arriba", async () => {
    const { status } = await api("/health");
    expect(status).toBe(200);
  });

  test("se puede crear una cuenta", async () => {
    const { status, body } = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeUser" }),
    });
    expect(status).toBe(201);
    expect(body.id).toBeDefined();
  });

  test("se puede depositar en una cuenta recien creada", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDeposito" }),
    });
    const { status, body } = await api(
      `/accounts/${cuenta.body.id}/deposit`,
      { method: "POST", body: JSON.stringify({ amountCents: 1000 }) }
    );
    expect(status).toBe(200);
    expect(Number(body.balance)).toBe(1000);
  });

  test("se puede consultar el listado de cuentas", async () => {
    const { status, body } = await api("/accounts");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test("se puede ejecutar una transferencia basica entre dos cuentas", async () => {
    const origen = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeOrigen" }),
    });
    await api(`/accounts/${origen.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const destino = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDestino" }),
    });

    const { status } = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: origen.body.id,
        toId: destino.body.id,
        amountCents: 5000,
      }),
    });
    expect(status).toBe(201);
  });

  test("se puede retirar la totalidad del saldo depositado", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeRetiro" }),
    });
    await api(`/accounts/${cuenta.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });

    const { status } = await api(`/accounts/${cuenta.body.id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });
    expect(status).toBe(200);
  });

  test("el endpoint GET /accounts/:id responde en menos de 300 ms para una cuenta existente", async () => {
    // Creamos un usuario de prueba rápido
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeUserFast" })
    });
    const id = cuenta.body.id;

    const startTime = Date.now();
    const res = await api(`/accounts/${id}`);
    const duration = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(300); // El tiempo de respuesta debe ser menor a 300 ms
  });

  test("las cinco rutas principales (health, accounts, deposit, withdraw, transfers) responden todas dentro de un mismo recorrido secuencial sin error 500", async () => {
    // 1. Health
    const r1 = await api("/health");
    expect(r1.status).not.toBe(500);

    // 2. Crear cuenta
    const r2 = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeSeqUser" })
    });
    expect(r2.status).not.toBe(500);
    const id = r2.body.id;

    // 3. Depositar
    const r3 = await api(`/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 1000 })
    });
    expect(r3.status).not.toBe(500);

    // 4. Retirar
    const r4 = await api(`/accounts/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 500 })
    });
    expect(r4.status).not.toBe(500);

    // 5. Transferir a una segunda cuenta
    const destino = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeSeqDest" })
    });
    const r5 = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: id,
        toId: destino.body.id,
        amountCents: 100
      })
    });
    expect(r5.status).not.toBe(500);
  });
});
