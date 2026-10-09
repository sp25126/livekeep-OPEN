'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CompanyInfo } from '@/components/DashboardHeader';

export interface AccountLedger {
  id: string;
  name: string;
  type: 'bank' | 'cash';
}

export function useTallyConnection() {
  const [isTallyConnected, setIsTallyConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [syncedAccounts, setSyncedAccounts] = useState<AccountLedger[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [currentCompany, setCurrentCompany] = useState<CompanyInfo | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // 1. Check Tally Port 9000 status
      const res = await fetch('/api/tally/status', { cache: 'no-store' });
      const data = await res.json();
      setIsTallyConnected(Boolean(data.connected));

      // 2. Fetch distinct accounts from Supabase vouchers
      try {
        const { data: vchData, error } = await supabase
          .from('vouchers')
          .select('from_account, to_account, party_name')
          .limit(100);

        if (!error && vchData && vchData.length > 0) {
          const accountNames = new Set<string>();
          vchData.forEach((v) => {
            if (v.from_account && v.from_account.trim()) accountNames.add(v.from_account.trim());
            if (v.to_account && v.to_account.trim()) accountNames.add(v.to_account.trim());
          });

          const parsedAccounts: AccountLedger[] = Array.from(accountNames).map((acc, idx) => {
            const isCash = acc.toLowerCase().includes('cash');
            return {
              id: `acc-${idx}`,
              name: acc,
              type: isCash ? 'cash' : 'bank'
            };
          });

          setSyncedAccounts(parsedAccounts);
        } else {
          setSyncedAccounts([]);
        }
      } catch (err) {
        setSyncedAccounts([]);
      }
    } catch (err) {
      setIsTallyConnected(false);
      setSyncedAccounts([]);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isTallyConnected,
    isChecking,
    syncedAccounts,
    companies,
    currentCompany,
    setCurrentCompany,
    setCompanies,
    checkConnection
  };
}
