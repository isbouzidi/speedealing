<?php
/* Copyright (C) 2012	Regis Houssin	<regis.houssin@capnetworks.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

$banks = array(
		'CHARSET' => 'UTF-8',
		'Bank' => 'Bank',
		'Banks' => 'Banks',
		'MenuBankCash' => 'Bank/Cash',
		'MenuSetupBank' => 'Bank/Cash setup',
		'BankName' => 'Bank name',
		'FinancialAccount' => 'Account',
		'FinancialAccounts' => 'Accounts',
		'BankAccount' => 'Bank account',
		'BankAccounts' => 'Bank accounts',
		'AccountRef' => 'Financial account ref',
		'AccountLabel' => 'Financial account label',
		'CashAccount' => 'Cash account',
		'CashAccounts' => 'Cash accounts',
		'MainAccount' => 'Main account',
		'CurrentAccount' => 'Current account',
		'CurrentAccounts' => 'Current accounts',
		'SavingAccount' => 'Savings account',
		'SavingAccounts' => 'Savings accounts',
		'ErrorBankLabelAlreadyExists' => 'Financial account label already exists',
		'BankBalance' => 'Balance',
		'BalanceMinimalAllowed' => 'Minimum allowed balance',
		'BalanceMinimalDesired' => 'Minimum desired balance',
		'InitialBankBalance' => 'Initial balance',
		'EndBankBalance' => 'End balance',
		'CurrentBalance' => 'Current balance',
		'FutureBalance' => 'Future balance',
		'ShowAllTimeBalance' => 'Show balance from start',
		'Reconciliation' => 'Reconciliation',
		'RIB' => 'Bank Account Number',
		'IBAN' => 'IBAN number',
		'BIC' => 'BIC/SWIFT number',
		'StandingOrders' => 'Standing orders',
		'StandingOrder' => 'Standing order',
		'Withdrawals' => 'Withdrawals',
		'Withdrawal' => 'Withdrawal',
		'AccountStatement' => 'Account statement',
		'AccountStatementShort' => 'Statement',
		'AccountStatements' => 'Account statements',
		'LastAccountStatements' => 'Last account statements',
		'Rapprochement' => 'Reconciliate',
		'IOMonthlyReporting' => 'Monthly reporting',
		'BankAccountDomiciliation' => 'Account address',
		'BankAccountCountry' => 'Account country',
		'BankAccountOwner' => 'Account owner name',
		'BankAccountOwnerAddress' => 'Account owner address',
		'RIBControlError' => 'Integrity check of values fails. This means information for this account number are not complete or wrong (check country, numbers and IBAN).',
		'CreateAccount' => 'Create account',
		'NewAccount' => 'New account',
		'NewBankAccount' => 'New bank account',
		'NewFinancialAccount' => 'New financial account',
		'MenuNewFinancialAccount' => 'New financial account',
		'NewCurrentAccount' => 'New current account',
		'NewSavingAccount' => 'New savings account',
		'NewCashAccount' => 'New cash account',
		'EditFinancialAccount' => 'Edit account',
		'AccountSetup' => 'Financial accounts setup',
		'SearchBankMovement' => 'Search bank movement',
		'Debts' => 'Debts',
		'LabelBankCashAccount' => 'Bank or cash label',
		'AccountType' => 'Account type',
		'BankType0' => 'Savings account',
		'BankType1' => 'Current or credit card account',
		'BankType2' => 'Cash account',
		'IfBankAccount' => 'If bank account',
		'AccountsArea' => 'Accounts area',
		'AccountCard' => 'Account card',
		'DeleteAccount' => 'Delete account',
		'ConfirmDeleteAccount' => 'Are you sure you want to delete this account ?',
		'Account' => 'Account',
		'ByCategories' => 'By categories',
		'ByRubriques' => 'By categories',
		'BankTransactionByCategories' => 'Bank transactions by categories',
		'BankTransactionForCategory' => 'Bank transactions for category <b>%s</b>',
		'RemoveFromRubrique' => 'Remove link with category',
		'RemoveFromRubriqueConfirm' => 'Are you sure you want to remove link between the transaction and the category ?',
		'ListBankTransactions' => 'List of bank transactions',
		'IdTransaction' => 'Transaction ID',
		'BankTransactions' => 'Bank transactions',
		'SearchTransaction' => 'Search transaction',
		'ListTransactions' => 'List transactions',
		'ListTransactionsByCategory' => 'List transaction/category',
		'TransactionsToConciliate' => 'Transactions to reconcile',
		'Conciliable' => 'Can be reconciled',
		'Conciliate' => 'Reconcile',
		'Conciliation' => 'Reconciliation',
		'ConciliationForAccount' => 'Reconcile this account',
		'IncludeClosedAccount' => 'Include closed accounts',
		'OnlyOpenedAccount' => 'Only opened accounts',
		'AccountToCredit' => 'Account to credit',
		'AccountToDebit' => 'Account to debit',
		'DisableConciliation' => 'Disable reconciliation feature for this account',
		'ConciliationDisabled' => 'Reconciliation feature disabled',
		'StatusAccountOpened' => 'Opened',
		'StatusAccountClosed' => 'Closed',
		'AccountIdShort' => 'Number',
		'EditBankRecord' => 'Edit record',
		'LineRecord' => 'Transaction',
		'AddBankRecord' => 'Add transaction',
		'AddBankRecordLong' => 'Add transaction manually',
		'ConciliatedBy' => 'Reconciled by',
		'DateConciliating' => 'Reconcile date',
		'BankLineConciliated' => 'Transaction reconciled',
		'CustomerInvoicePayment' => 'Customer payment',
		'SupplierInvoicePayment' => 'Supplier payment',
		'WithdrawalPayment' => 'Withdrawal payment',
		'SocialContributionPayment' => 'Social contribution payment',
		'FinancialAccountJournal' => 'Financial account journal',
		'BankTransfer' => 'Bank transfer',
		'BankTransfers' => 'Bank transfers',
		'TransferDesc' => 'Transfer from one account to another one, Speedealing will write two records (a debit in source account and a credit in target account, of the same amount. The same label and date will be used for this transaction)',
		'TransferFrom' => 'From',
		'TransferTo' => 'To',
		'TransferFromToDone' => 'A transfer from <b>%s</b> to <b>%s</b> of <b>%s</b> %s has been recorded.',
		'CheckTransmitter' => 'Transmitter',
		'ValidateCheckReceipt' => 'Validate this check receipt ?',
		'ConfirmValidateCheckReceipt' => 'Are you sure you want to validate this check receipt, no change will be possible once this is done ?',
		'DeleteCheckReceipt' => 'Delete this check receipt ?',
		'ConfirmDeleteCheckReceipt' => 'Are you sure you want to delete this check receipt ?',
		'BankChecks' => 'Bank checks',
		'BankChecksToReceipt' => 'Checks waiting for deposit',
		'ShowCheckReceipt' => 'Show check deposit receipt',
		'NumberOfCheques' => 'Nb of check',
		'DeleteTransaction' => 'Delete transaction',
		'ConfirmDeleteTransaction' => 'Are you sure you want to delete this transaction ?',
		'ThisWillAlsoDeleteBankRecord' => 'This will also delete generated bank transactions',
		'BankMovements' => 'Movements',
		'CashBudget' => 'Cash budget',
		'PlannedTransactions' => 'Planned transactions',
		'Graph' => 'Graphics',
		'ExportDataset_banque_1' => 'Bank transactions and account statement',
		'TransactionOnTheOtherAccount' => 'Transaction on the other account',
		'TransactionWithOtherAccount' => 'Account transfer',
		'PaymentNumberUpdateSucceeded' => 'Payment number updated succesfully',
		'PaymentNumberUpdateFailed' => 'Payment number could not be updated',
		'PaymentDateUpdateSucceeded' => 'Payment date update succesfully',
		'PaymentDateUpdateFailed' => 'Payment date could not be updated',
		'Transactions' => 'Transactions',
		'BankTransactionLine' => 'Bank transaction',
		'AllAccounts' => 'All bank/cash accounts',
		'BackToAccount' => 'Back to account',
		'ShowAllAccounts' => 'Show for all accounts',
		'FutureTransaction' => 'Transaction in futur. No way to conciliate.',
		'SelectChequeTransactionAndGenerate' => 'Select/filter checks to include into the check deposit receipt and click on "Create".',
		'InputReceiptNumber' => 'Choose the bank statement related with the conciliation. Use a sortable numeric value (such as, YYYYMM)',
		'EventualyAddCategory' => 'Eventually, specify a category in which to classify the records',
		'ToConciliate' => 'To conciliate?',
		'ThenCheckLinesAndConciliate' => 'Then, check the lines present in the bank statement and click'
);
?>