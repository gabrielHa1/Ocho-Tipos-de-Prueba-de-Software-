const { formatMoney, buildTransferReceipt } = require("../../src/services/money");

describe("Snapshot testing (formato y estructuras de salida)", () => {
  test("formatMoney con importe entero de soles", () => {
    expect(formatMoney(1050, "PEN")).toMatchInlineSnapshot(`"PEN 10.5"`);
  });

  test("formatMoney con importe menor a una unidad", () => {
    expect(formatMoney(5, "USD")).toMatchInlineSnapshot(`"USD 0.05"`);
  });

  test("formatMoney con importe exacto sin centimos", () => {
    expect(formatMoney(500000, "PEN")).toMatchInlineSnapshot(`"PEN 5000"`);
  });

  test("buildTransferReceipt genera la estructura esperada del recibo", () => {
    const receipt = buildTransferReceipt({
      receiptId: 1,
      amountCents: 3000,
      fromOwner: "Ana",
      toOwner: "Beto",
      reference: "PAGO-01",
    });
    expect(receipt).toMatchInlineSnapshot(`
{
  "amount": "PEN 30",
  "receiptId": undefined,
  "reference": "PAGO-01",
  "summary": "Ana -> Beto",
}
`);
  });

  test("buildTransferReceipt sin referencia usa el valor por defecto", () => {
    const receipt = buildTransferReceipt({
      receiptId: 2,
      amountCents: 1500,
      fromOwner: "Carlos",
      toOwner: "Daniel",
    });
    expect(receipt.reference).toBe("SIN-REFERENCIA");
  });

  test("la forma del objeto de error HTTP se mantiene estable", () => {
    const errorResponse = {
      error: "ValidationError",
      message: "El monto debe ser un entero positivo",
      timestamp: "2026-03-30T10:00:00.000Z",
    };
    expect(errorResponse).toMatchInlineSnapshot(`
{
  "error": "ValidationError",
  "message": "El monto debe ser un entero positivo",
  "timestamp": "2026-03-30T10:00:00.000Z",
}
`);
  });

  // =========================================================================
  // --- ENUNCIADOS PROPUESTOS RESUELTOS (Tipo 6) ---
  // =========================================================================

  test("capturar el snapshot del cuerpo de respuesta de POST /accounts usando property matchers para id y created_at", async () => {
    const request = require("supertest");
    const API_URL = "http://localhost:3000";

    const res = await request(API_URL)
      .post("/accounts")
      .send({ owner: "Gabriel Alonzo" });

    expect(res.status).toBe(201);
    
    expect(res.body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.any(String)
    });
  });

  test("capturar el snapshot de buildTransferReceipt para un monto con tres cifras de céntimos redondeadas", () => {
    const receipt = buildTransferReceipt({
      receiptId: 99,
      amountCents: 35505,
      fromOwner: "Gabriel",
      toOwner: "Daniela",
      reference: "TRANSF-99"
    });

    expect(receipt).toMatchSnapshot();
  });
});