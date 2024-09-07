const soap = require('soap');
const express = require('express');
const bodyParser = require('body-parser');

let accounts = {
    "123456": { balance: 2500.00, transactions: [] },
    "654321": { balance: 1500.00, transactions: [] }
};

const service = {
    AccountService: {
        AccountServiceSoapPort: {
            getBalance: function(args) {
                const account = accounts[args.accountId];
                if (!account) {
                    throw new Error("Account not found");
                }
                return { balance: account.balance };
            },
            getTransactions: function(args) {
                const account = accounts[args.accountId];
                if (!account) {
                    throw new Error("Account not found");
                }
                const start = (args.pageNumber - 1) * args.pageSize;
                const paginatedTransactions = account.transactions.slice(start, start + args.pageSize);
                return { transactions: paginatedTransactions };
            },
            transferFunds: function(args) {
                const { creditor, debtor, amount, currency } = args;
                const creditorAccount = accounts[creditor];
                const debtorAccount = accounts[debtor];

                if (!creditorAccount || !debtorAccount) {
                    throw new Error("Account not found");
                }

                if (creditorAccount.balance < amount) {
                    throw new Error("Insufficient funds");
                }

                creditorAccount.balance -= amount;
                debtorAccount.balance += amount;

                const transactionId = `tx${creditorAccount.transactions.length + 1}`;
                creditorAccount.transactions.push({ transactionId, amount: -amount, date: new Date().toISOString(), type: "debit" });
                debtorAccount.transactions.push({ transactionId, amount, date: new Date().toISOString(), type: "credit" });

                return { status: "success", transactionId };
            }
        }
    }
};

const xml = require('fs').readFileSync('path/to/wsdl/file.wsdl', 'utf8');

const app = express();
app.use(bodyParser.raw({ type: function() { return true; }, limit: '5mb' }));

app.listen(8000, function() {
    soap.listen(app, '/wsdl', service, xml);
    console.log('SOAP server is running on port 8000');
});
