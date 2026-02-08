import { InMemoryPostingsRepo } from "./repos/postings.repo";
import { InMemoryTransactionsRepo } from "./repos/transactions.repo";
import { CsvImportService } from "./services/csv-import.service";
import { LedgerPostService } from "./services/ledger-post.service";

const transactionsRepo = new InMemoryTransactionsRepo();
const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
const ledgerPostService = new LedgerPostService(transactionsRepo, postingsRepo);
const csvImportService = new CsvImportService(transactionsRepo, postingsRepo);

export function getLedgerPostService() {
  return ledgerPostService;
}

export function getCsvImportService() {
  return csvImportService;
}
