


{ path: 'expenses/', method: 'get', handler: ExpenseController.getAllExpenses },
{ path: 'expenses/', method: 'delete', handler: ExpenseController.deleteAllExpenses },
{ path: 'expenses/', method: 'post', handler: ExpenseController.createExpense },
{ path: 'expenses/initialize', method: 'post', handler: ExpenseController.initializeExpenses },
{ path: 'expenses/bulk-add-csv', method: 'post', handler: ExpenseController.bulkAddExpensesFromCSV },
{ path: 'expenses/sale/:saleId', method: 'get', handler: ExpenseController.getExpensesBySaleId },
{ path: 'expenses/:id', method: 'get', handler: ExpenseController.getExpenseById },
{ path: 'expenses/:id', method: 'patch', handler: ExpenseController.updateExpense },
{ path: 'expenses/:id', method: 'delete', handler: ExpenseController.deleteExpenseById },