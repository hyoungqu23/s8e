import { InMemoryPostingsRepo } from "./repos/postings.repo";
import { InMemoryTransactionsRepo } from "./repos/transactions.repo";
import { LedgerPostService } from "./services/ledger-post.service";

const transactionsRepo = new InMemoryTransactionsRepo();
const postingsRepo = new InMemoryPostingsRepo((transactionId) => transactionsRepo.getStatus(transactionId));
const ledgerPostService = new LedgerPostService(transactionsRepo, postingsRepo);

export function getLedgerPostService() {
  return ledgerPostService;
}
