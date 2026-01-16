// Ticket management utility
// Manages user tickets with lucky numbers and draw numbers

export interface Ticket {
  id: string;
  userId: string;
  luckyNumbers: string[]; // Array of selected numbers (e.g., ["05", "23", "67"])
  drawNumber: string; // Draw identifier (e.g., "DRAW-001")
  purchaseDate: number; // Timestamp
  status: "active" | "won" | "lost";
  price: number;
}

const STORAGE_KEY = "userTickets";
const DRAW_PREFIX = "DRAW";

// Get current draw number from the latest active draw
// This function should be called from components that have access to DrawManager
export const getCurrentDrawNumber = (): string => {
  // Try to get from localStorage directly to avoid circular dependency
  try {
    const drawsData = localStorage.getItem("draws");
    if (drawsData) {
      const draws = JSON.parse(drawsData);
      const pendingDraws = draws.filter((d: any) => d.status === "pending");
      if (pendingDraws.length > 0) {
        const latestDraw = pendingDraws.sort((a: any, b: any) => b.drawDate - a.drawDate)[0];
        return latestDraw.drawNumber;
      }
    }
  } catch {
    // Fallback if error
  }
  
  // Fallback to old method if no active draw
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${DRAW_PREFIX}-${year}-${weekNumber.toString().padStart(3, "0")}`;
};

export const TicketManager = {
  // Get all tickets for a user
  getUserTickets(userId: string): Ticket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const allTickets: Ticket[] = JSON.parse(data);
      return allTickets.filter((ticket) => ticket.userId === userId);
    } catch {
      return [];
    }
  },

  // Get active tickets for current draw
  getActiveTickets(userId: string): Ticket[] {
    const tickets = this.getUserTickets(userId);
    const currentDraw = getCurrentDrawNumber();
    return tickets.filter(
      (ticket) => ticket.status === "active" && ticket.drawNumber === currentDraw
    );
  },

  // Get past tickets
  getPastTickets(userId: string): Ticket[] {
    const tickets = this.getUserTickets(userId);
    const currentDraw = getCurrentDrawNumber();
    return tickets.filter(
      (ticket) => ticket.drawNumber !== currentDraw || ticket.status !== "active"
    );
  },

  // Create new tickets
  createTickets(
    userId: string,
    luckyNumbers: string[],
    pricePerTicket: number
  ): Ticket[] {
    const drawNumber = getCurrentDrawNumber();
    const purchaseDate = Date.now();
    const newTickets: Ticket[] = luckyNumbers.map((number, index) => ({
      id: `ticket_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      luckyNumbers: [number], // Each ticket has one lucky number
      drawNumber,
      purchaseDate,
      status: "active" as const,
      price: pricePerTicket,
    }));

    // Save to storage
    const existingTickets = this.getAllTickets();
    const updatedTickets = [...existingTickets, ...newTickets];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));

    return newTickets;
  },

  // Get all tickets (for admin purposes)
  getAllTickets(): Ticket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Update ticket status
  updateTicketStatus(ticketId: string, status: "active" | "won" | "lost"): boolean {
    try {
      const tickets = this.getAllTickets();
      const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
      if (ticketIndex === -1) return false;

      tickets[ticketIndex].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      return true;
    } catch {
      return false;
    }
  },

  // Get tickets by draw number
  getTicketsByDraw(drawNumber: string): Ticket[] {
    const tickets = this.getAllTickets();
    return tickets.filter((ticket) => ticket.drawNumber === drawNumber);
  },

  // Save user tickets (updates the global tickets array)
  saveUserTickets(userId: string, userTickets: Ticket[]): void {
    try {
      const allTickets = this.getAllTickets();
      // Remove old tickets for this user
      const filteredTickets = allTickets.filter((t) => t.userId !== userId);
      // Add updated tickets
      const updatedTickets = [...filteredTickets, ...userTickets];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));
    } catch (error) {
      console.error("Error saving user tickets:", error);
    }
  },

  // Add a single ticket (for agent allocation)
  addTicket(ticket: Ticket): void {
    try {
      const allTickets = this.getAllTickets();
      allTickets.push(ticket);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTickets));
    } catch (error) {
      console.error("Error adding ticket:", error);
    }
  },
};
