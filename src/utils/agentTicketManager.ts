// Agent ticket allocation utility
// Handles ticket allocation by agents to users

import { TicketManager, Ticket } from "./ticketManager";
import { AgentWalletManager } from "./agentWallet";
import { DrawManager } from "./drawManager";

export interface AgentTicketSale {
  id: string;
  agentId: string;
  userId: string;
  ticketId: string;
  drawId: string;
  ticketNumber: string;
  price: number;
  commission: number;
  paymentMethod: "cash" | "online";
  timestamp: number;
}

const STORAGE_KEY = "agentTicketSales";

export const AgentTicketManager = {
  // Allocate ticket to user via agent
  allocateTicket(
    agentId: string,
    userId: string,
    drawId: string,
    ticketNumber: string,
    paymentMethod: "cash" | "online" = "cash"
  ): { success: boolean; ticket?: Ticket; error?: string } {
    try {
      // Get draw information
      const draw = DrawManager.getDrawById(drawId);
      if (!draw) {
        return { success: false, error: "Draw not found" };
      }

      if (draw.status !== "pending") {
        return { success: false, error: "Draw is not active" };
      }

      // Check if ticket number is available
      const allTickets = TicketManager.getAllTickets();
      const drawTickets = allTickets.filter(
        (t) => t.drawNumber === draw.drawNumber && t.luckyNumbers.includes(ticketNumber)
      );

      if (drawTickets.length > 0) {
        return { success: false, error: "Ticket number already taken" };
      }

      // Get ticket price
      const ticketPrice = draw.ticketPrice || 500;

      // Check agent wallet balance
      const wallet = AgentWalletManager.getWallet(agentId);
      if (wallet.balance < ticketPrice) {
        return { success: false, error: "Insufficient wallet balance" };
      }

      // Deduct from agent wallet
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deducted = AgentWalletManager.deduct(agentId, ticketPrice, ticketId, drawId);
      
      if (!deducted) {
        return { success: false, error: "Failed to deduct from wallet" };
      }

      // Create ticket
      const ticket: Ticket = {
        id: ticketId,
        userId,
        luckyNumbers: [ticketNumber],
        drawNumber: draw.drawNumber,
        purchaseDate: Date.now(),
        status: "active",
        price: ticketPrice,
      };

      // Save ticket
      TicketManager.addTicket(ticket);

      // Credit commission to agent
      AgentWalletManager.creditCommission(agentId, ticketPrice, ticketId, drawId);

      // Record sale
      const sale: AgentTicketSale = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        userId,
        ticketId,
        drawId,
        ticketNumber,
        price: ticketPrice,
        commission: ticketPrice * 0.1,
        paymentMethod,
        timestamp: Date.now(),
      };

      this.saveSale(sale);

      return { success: true, ticket };
    } catch (error: any) {
      console.error("Error allocating ticket:", error);
      return { success: false, error: error.message || "Failed to allocate ticket" };
    }
  },

  // Save sale record
  saveSale(sale: AgentTicketSale): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const sales: AgentTicketSale[] = data ? JSON.parse(data) : [];
      sales.push(sale);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  },

  // Get agent sales
  getAgentSales(agentId: string, limit?: number): AgentTicketSale[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const sales: AgentTicketSale[] = JSON.parse(data);
      const agentSales = sales
        .filter((s) => s.agentId === agentId)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      if (limit) {
        return agentSales.slice(0, limit);
      }
      
      return agentSales;
    } catch {
      return [];
    }
  },

  // Get available ticket numbers for a draw
  getAvailableNumbers(drawId: string): string[] {
    try {
      const draw = DrawManager.getDrawById(drawId);
      if (!draw) return [];

      const allTickets = TicketManager.getAllTickets();
      const drawTickets = allTickets.filter((t) => t.drawNumber === draw.drawNumber);
      const takenNumbers = new Set<string>();

      drawTickets.forEach((ticket) => {
        ticket.luckyNumbers.forEach((num) => takenNumbers.add(num));
      });

      // Generate all numbers from 00 to 99
      const allNumbers: string[] = [];
      for (let i = 0; i <= 99; i++) {
        allNumbers.push(i.toString().padStart(2, "0"));
      }

      return allNumbers.filter((num) => !takenNumbers.has(num));
    } catch {
      return [];
    }
  },
};
