// Alícuotas (%) que el comercio absorbe según el medio de pago.
// El precio para el cliente NO cambia: estas deducciones salen de la ganancia.
// Debe reflejar lo mismo que el backend (poroto-petchop-servidor/src/config/paymentFees.js).
export const PAYMENT_FEES = {
  tarjeta_debito: { retencionIIBB: 2.5, comisionMP: 2 },
  tarjeta: { retencionIIBB: 2.5, comisionMP: 6.29 },
};

export const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta crédito',
  tarjeta_debito: 'Tarjeta débito',
  transferencia: 'Transferencia',
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const calcularDeduccionesPago = (metodoPago, totalFinal) => {
  const total = Number(totalFinal) || 0;
  const fees = PAYMENT_FEES[metodoPago];

  if (!fees) {
    return { retencionIIBB: 0, comisionMP: 0, impuestosPago: 0, totalNeto: round2(total), tieneDeducciones: false };
  }

  const retencionIIBB = round2((total * fees.retencionIIBB) / 100);
  const comisionMP = round2((total * fees.comisionMP) / 100);
  const impuestosPago = round2(retencionIIBB + comisionMP);

  return {
    retencionIIBB,
    comisionMP,
    impuestosPago,
    totalNeto: round2(total - impuestosPago),
    tieneDeducciones: true,
    porcentajeIIBB: fees.retencionIIBB,
    porcentajeMP: fees.comisionMP,
  };
};

export const getPaymentMethodLabel = (metodoPago) =>
  PAYMENT_METHOD_LABELS[metodoPago] || metodoPago;
