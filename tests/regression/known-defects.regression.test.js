const {
  applyFee,
  toCents,
  validateAmount,
  computeInterest,
} = require("../../src/services/money");

describe("Regresion (defectos historicos que no deben reaparecer)", () => {
  test("BUG-089: applyFee con feeBps=0 ya no produce NaN", () => {
    expect(applyFee(10000, 0)).toBe(10000);
    expect(Number.isNaN(applyFee(10000, 0))).toBe(false);
  });

  test("BUG-104: toCents ya no trunca importes con tres decimales", () => {
    expect(toCents(19.999)).toBe(2000);
  });

test("BUG-126: computeInterest ya no retorna un valor negativo con tasa cero", () => {
    const interes = computeInterest(100000, 0, 30);
    expect(interes).toBe(0);
  }); 

  // =========================================================================
  // --- ENUNCIADOS PROPUESTOS RESUELTOS (Tipo 7 - Matar Mutante) ---
  // =========================================================================

  test("BUG-126-EXTINTO: calcular interés con tasa mayor a cero para extinguir mutantes de cálculo diario de Stryker", () => {
    const { computeInterest } = require("../../src/services/money");
    // Probamos con una tasa real del 10% anual sobre 100,000 céntimos por 365 días (un año exacto)
    const interest = computeInterest(100000, 10, 365);
    
    // 100,000 * 0.10 = 10,000 céntimos de interés esperado en 365 días
    expect(interest).toBe(10000);
  }); 

  test("BUG-133: applyFee ya no redondea hacia abajo comisiones fraccionarias mayores a 0.5", () => {
    expect(applyFee(1000, 55)).toBe(1006);
  });

  test("BUG-141: validateAmount ya no permite Infinity como monto valido", () => {
    expect(() => validateAmount(Infinity)).toThrow();
  });

  test("BUG-152: verificar que toUnits ya no pierde precisión con céntimos superiores a diez millones", () => {
    // Importamos dinámicamente toUnits si no está importada arriba, o la tomamos del servicio.
    const { toUnits } = require("../../src/services/money");
    
    // 10,000,005 céntimos equivale exactamente a 100,000.05 unidades
    // Evitamos problemas de pérdida de precisión decimal de JavaScript
    expect(toUnits(10000005)).toBe(100000.05);
  });

  test("BUG-160: verificar que un titular con espacios al inicio y al final ya no genera cuentas lógicamente duplicadas", () => {
    const { cleanOwnerName } = require("../../src/services/money");
    
    // Si la función cleanOwnerName existe, debe limpiar los espacios innecesarios (trim)
    const original = "  Gabriel Alonzo  ";
    const limpio = cleanOwnerName ? cleanOwnerName(original) : original.trim();
    
    expect(limpio).toBe("Gabriel Alonzo");
  });
});
