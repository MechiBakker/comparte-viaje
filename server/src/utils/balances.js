/**
 * Dado un listado de gastos con sus splits, calcula el balance
 * neto de cada usuario (positivo = le deben, negativo = debe)
 * y luego arma una lista simplificada de transferencias
 * sugeridas para saldar las cuentas con la menor cantidad de
 * movimientos posible.
 *
 * expenses: [{ id, paid_by, amount, splits: [{ user_id, amount_owed }] }]
 */
export function calculateBalances(expenses) {
  const net = {}; // user_id -> balance neto

  for (const expense of expenses) {
    net[expense.paid_by] = (net[expense.paid_by] || 0) + Number(expense.amount);
    for (const split of expense.splits) {
      net[split.user_id] = (net[split.user_id] || 0) - Number(split.amount_owed);
    }
  }

  // Redondeo a 2 decimales para evitar arrastre de floats
  for (const uid of Object.keys(net)) {
    net[uid] = Math.round(net[uid] * 100) / 100;
  }

  const debtors = Object.entries(net)
    .filter(([, amount]) => amount < 0)
    .map(([user_id, amount]) => ({ user_id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(net)
    .filter(([, amount]) => amount > 0)
    .map(([user_id, amount]) => ({ user_id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.user_id,
        to: creditor.user_id,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return { net, settlements };
}
