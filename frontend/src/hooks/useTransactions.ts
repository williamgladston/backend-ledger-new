import { useQuery } from "@tanstack/react-query";
import * as transactionsApi from "@/api/transactions";
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { GetTransactionsParams } from "@/types/transaction";

export function useTransactions(params: GetTransactionsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(params as Record<string, unknown>),
    queryFn: () => transactionsApi.getTransactions(params),
  });
}
