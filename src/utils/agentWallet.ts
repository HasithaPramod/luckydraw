// Agent wallet management utility
// Handles agent wallet balance, transactions, and commissions

export interface AgentWallet {
  agentId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: number;
  relatedTicketId?: string;
  relatedDrawId?: string;
}

const STORAGE_KEY = "agentWallets";
const COMMISSION_RATE = 0.1; // 10% commission

export const AgentWalletManager = {
  // Get or create agent wallet
  getWallet(agentId: string): AgentWallet {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Create new wallet
        const newWallet: AgentWallet = {
          agentId,
          balance: 0,
          transactions: [],
        };
        this.saveWallet(newWallet);
        return newWallet;
      }

      const wallets: AgentWallet[] = JSON.parse(data);
      const wallet = wallets.find((w) => w.agentId === agentId);
      
      if (wallet) {
        return wallet;
      }

      // Create new wallet if not found
      const newWallet: AgentWallet = {
        agentId,
        balance: 0,
        transactions: [],
      };
      wallets.push(newWallet);
      this.saveAllWallets(wallets);
      return newWallet;
    } catch {
      // Return default wallet on error
      return {
        agentId,
        balance: 0,
        transactions: [],
      };
    }
  },

  // Save wallet
  saveWallet(wallet: AgentWallet): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const wallets: AgentWallet[] = data ? JSON.parse(data) : [];
      const index = wallets.findIndex((w) => w.agentId === wallet.agentId);
      
      if (index >= 0) {
        wallets[index] = wallet;
      } else {
        wallets.push(wallet);
      }
      
      this.saveAllWallets(wallets);
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  },

  // Save all wallets
  saveAllWallets(wallets: AgentWallet[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    } catch (error) {
      console.error("Error saving wallets:", error);
    }
  },

  // Deduct amount from wallet (for ticket purchase)
  deduct(agentId: string, amount: number, ticketId: string, drawId: string): boolean {
    const wallet = this.getWallet(agentId);
    
    if (wallet.balance < amount) {
      return false; // Insufficient balance
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "debit",
      amount,
      description: `Ticket purchase - ${ticketId}`,
      timestamp: Date.now(),
      relatedTicketId: ticketId,
      relatedDrawId: drawId,
    });

    this.saveWallet(wallet);
    return true;
  },

  // Credit commission to wallet
  creditCommission(agentId: string, ticketPrice: number, ticketId: string, drawId: string): void {
    const commission = ticketPrice * COMMISSION_RATE;
    const wallet = this.getWallet(agentId);

    wallet.balance += commission;
    wallet.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "credit",
      amount: commission,
      description: `Commission (10%) - Ticket ${ticketId}`,
      timestamp: Date.now(),
      relatedTicketId: ticketId,
      relatedDrawId: drawId,
    });

    this.saveWallet(wallet);
  },

  // Add funds to wallet (for top-up, admin operations)
  addFunds(agentId: string, amount: number, description: string): void {
    const wallet = this.getWallet(agentId);

    wallet.balance += amount;
    wallet.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "credit",
      amount,
      description,
      timestamp: Date.now(),
    });

    this.saveWallet(wallet);
  },

  // Get transaction history
  getTransactions(agentId: string, limit?: number): WalletTransaction[] {
    const wallet = this.getWallet(agentId);
    const transactions = wallet.transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    if (limit) {
      return transactions.slice(0, limit);
    }
    
    return transactions;
  },

  // Get today's sales and commissions
  getTodayStats(agentId: string): { sales: number; commissions: number; ticketsSold: number } {
    const wallet = this.getWallet(agentId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayTransactions = wallet.transactions.filter(
      (txn) => txn.timestamp >= todayStart
    );

    const sales = todayTransactions
      .filter((txn) => txn.type === "debit")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const commissions = todayTransactions
      .filter((txn) => txn.type === "credit" && txn.description.includes("Commission"))
      .reduce((sum, txn) => sum + txn.amount, 0);

    const ticketsSold = todayTransactions.filter(
      (txn) => txn.type === "debit"
    ).length;

    return { sales, commissions, ticketsSold };
  },
};
