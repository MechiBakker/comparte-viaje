export default function ExpenseList({ expenses, balance, participantNames }) {
  const nameFor = (id) => participantNames?.[id] || id;

  return (
    <div className="expenses">
      <div className="expenses__list">
        {expenses.length === 0 && <p className="empty-state">Todavía no se cargaron gastos.</p>}

        {expenses.map((expense) => (
          <div key={expense.id} className="expense-row">
            <div>
              <strong>{expense.description}</strong>
              <div className="expense-row__meta">
                Pagó {expense.profiles?.name || nameFor(expense.paid_by)}
              </div>
            </div>
            <span className="expense-row__amount">${Number(expense.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {balance && (
        <div className="balance">
          <h4>Cómo saldar cuentas</h4>
          {balance.settlements.length === 0 ? (
            <p className="empty-state">Todo está saldado. 🎉</p>
          ) : (
            <ul>
              {balance.settlements.map((s, i) => (
                <li key={i}>
                  <strong>{nameFor(s.from)}</strong> le debe{' '}
                  <strong>${s.amount.toFixed(2)}</strong> a <strong>{nameFor(s.to)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
