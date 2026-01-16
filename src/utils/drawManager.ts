// Draw management utility
// Manages draws and winning number matching
import { TicketManager } from "./ticketManager";

export interface Draw {
  id: string;
  drawNumber: string;
  title: string; // Draw title
  description?: string; // Draw description
  imageUrl?: string; // Image URL for the draw
  winningNumber: string; // The winning number (00-99)
  drawDate: number; // Timestamp when draw was created
  resultAnnouncementDate: number; // Timestamp when results will be announced
  ticketPrice: number; // Price per ticket for this draw
  status: "pending" | "completed";
  totalTickets: number;
  winningTickets: string[]; // Array of ticket IDs that won
  prizeAmount: number;
}

const STORAGE_KEY = "draws";
const DRAW_PREFIX = "DRAW";

// Generate a unique draw number
export const generateDrawNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  return `${DRAW_PREFIX}-${year}${month}${day}-${timestamp}`;
};

export const DrawManager = {
  // Compress base64 image
  compressImage(base64: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        } else {
          resolve(base64); // Fallback if canvas not available
        }
      };
      img.onerror = () => resolve(base64); // Fallback on error
      img.src = base64;
    });
  },

  // Cleanup old completed draws (keep only last 50)
  cleanupOldDraws(): void {
    try {
      const draws = this.getAllDraws();
      const completedDraws = draws.filter((d) => d.status === "completed");
      
      if (completedDraws.length > 50) {
        // Sort by date and keep only the 50 most recent
        const sorted = completedDraws.sort((a, b) => b.drawDate - a.drawDate);
        const toKeep = sorted.slice(0, 50);
        const toRemove = sorted.slice(50);
        
        // Remove old draws and their images
        const pendingDraws = draws.filter((d) => d.status === "pending");
        const updatedDraws = [...pendingDraws, ...toKeep];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDraws));
      }
    } catch (error) {
      console.error("Error cleaning up old draws:", error);
    }
  },

  // Create a new draw
  async createDraw(
    winningNumber: string,
    prizeAmount: number = 0,
    title: string = "",
    description: string = "",
    imageUrl: string = "",
    resultAnnouncementDate: number = Date.now(),
    ticketPrice: number = 500
  ): Promise<Draw> {
    // Cleanup old draws before creating new one
    this.cleanupOldDraws();

    // Compress image if provided
    let compressedImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith("data:image")) {
      try {
        compressedImageUrl = await this.compressImage(imageUrl);
      } catch (error) {
        console.error("Error compressing image:", error);
        // Use original if compression fails
      }
    }

    const drawNumber = generateDrawNumber();
    const draw: Draw = {
      id: `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      drawNumber,
      title: title || `Draw ${drawNumber}`,
      description: description || "",
      imageUrl: compressedImageUrl || "",
      winningNumber: winningNumber ? winningNumber.padStart(2, "0") : "", // Empty if not provided
      drawDate: Date.now(),
      resultAnnouncementDate,
      ticketPrice,
      status: "pending",
      totalTickets: 0,
      winningTickets: [],
      prizeAmount,
    };

    // Save draw with error handling for quota exceeded
    try {
      const draws = this.getAllDraws();
      draws.push(draw);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
    } catch (error: any) {
      if (error.name === "QuotaExceededError" || error.message?.includes("quota")) {
        // Try to free up space by removing old completed draws
        this.cleanupOldDraws();
        
        // Try again
        try {
          const draws = this.getAllDraws();
          draws.push(draw);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
        } catch (retryError) {
          throw new Error("Storage quota exceeded. Please clear old draws or use smaller images.");
        }
      } else {
        throw error;
      }
    }

    return draw;
  },

  // Get all draws
  getAllDraws(): Draw[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Get draw by ID
  getDrawById(drawId: string): Draw | null {
    const draws = this.getAllDraws();
    return draws.find((d) => d.id === drawId) || null;
  },

  // Get draw by draw number
  getDrawByNumber(drawNumber: string): Draw | null {
    const draws = this.getAllDraws();
    return draws.find((d) => d.drawNumber === drawNumber) || null;
  },

  // Get latest draw
  getLatestDraw(): Draw | null {
    const draws = this.getAllDraws();
    if (draws.length === 0) return null;
    return draws.sort((a, b) => b.drawDate - a.drawDate)[0];
  },

  // Get current active draw (latest pending draw)
  getCurrentActiveDraw(): Draw | null {
    const draws = this.getAllDraws();
    const pendingDraws = draws.filter((d) => d.status === "pending" && !d.winningNumber);
    if (pendingDraws.length === 0) return null;
    return pendingDraws.sort((a, b) => b.drawDate - a.drawDate)[0];
  },

  // Get all pending draws
  getAllPendingDraws(): Draw[] {
    const draws = this.getAllDraws();
    return draws.filter((d) => d.status === "pending").sort((a, b) => b.drawDate - a.drawDate);
  },

  // Extend draw result announcement date
  extendDrawDate(drawId: string, newDate: number): boolean {
    const draws = this.getAllDraws();
    const drawIndex = draws.findIndex((d) => d.id === drawId);
    if (drawIndex === -1) return false;

    draws[drawIndex].resultAnnouncementDate = newDate;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
    return true;
  },

  // Get ticket count for a draw
  getTicketCountForDraw(drawNumber: string): number {
    const allTickets = TicketManager.getAllTickets();
    return allTickets.filter((ticket: any) => 
      ticket.drawNumber === drawNumber && ticket.status === "active"
    ).length;
  },

  // Complete a draw and match winning tickets
  completeDraw(drawId: string): { draw: Draw; matchedTickets: number } {
    const draws = this.getAllDraws();
    const drawIndex = draws.findIndex((d) => d.id === drawId);
    if (drawIndex === -1) {
      throw new Error("Draw not found");
    }

    const draw = draws[drawIndex];
    if (draw.status === "completed") {
      return { draw, matchedTickets: draw.winningTickets.length };
    }

    const allTickets = TicketManager.getAllTickets();
    const drawTickets = allTickets.filter(
      (ticket: any) => ticket.drawNumber === draw.drawNumber && ticket.status === "active"
    );

    // Match winning number with ticket lucky numbers
    const winningNumber = draw.winningNumber;
    const matchedTicketIds: string[] = [];

    drawTickets.forEach((ticket: any) => {
      // Check if any of the ticket's lucky numbers match the winning number
      if (ticket.luckyNumbers && ticket.luckyNumbers.includes(winningNumber)) {
        matchedTicketIds.push(ticket.id);
        // Update ticket status to "won"
        TicketManager.updateTicketStatus(ticket.id, "won");
      } else {
        // Update ticket status to "lost"
        TicketManager.updateTicketStatus(ticket.id, "lost");
      }
    });

    // Update draw
    draw.status = "completed";
    draw.totalTickets = drawTickets.length;
    draw.winningTickets = matchedTicketIds;

    draws[drawIndex] = draw;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));

    return { draw, matchedTickets: matchedTicketIds.length };
  },

  // Get winning tickets for a draw
  getWinningTickets(drawId: string): any[] {
    const draw = this.getDrawById(drawId);
    if (!draw || !draw.winningTickets) return [];

    const allTickets = TicketManager.getAllTickets();
    return allTickets.filter((ticket: any) => draw.winningTickets.includes(ticket.id));
  },
};
