// Analytics and statistics utility
// Tracks platform metrics for CRM dashboard

import { TicketManager } from "./ticketManager";
import { DrawManager } from "./drawManager";

export interface PlatformStats {
  totalUsers: number;
  dailyRegistrations: number;
  weeklyRegistrations: number;
  monthlyRegistrations: number;
  activeUsers: number; // Users active in last 30 days
  totalTickets: number;
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalDraws: number;
  completedDraws: number;
  pendingDraws: number;
  averageTicketPrice: number;
  ticketsSoldToday: number;
  ticketsSoldThisWeek: number;
  ticketsSoldThisMonth: number;
}

export interface UserActivity {
  userId: string;
  email: string;
  name: string;
  registrationDate: number;
  lastActivity: number;
  totalTickets: number;
  totalSpent: number;
  status: "active" | "inactive";
}

const ACTIVE_USER_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const Analytics = {
  // Get all registered users
  getAllUsers(): Array<{ id: string; email: string; firstName: string; lastName: string; registrationDate?: number }> {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) return [];
      
      const users = JSON.parse(usersData);
      // Extract registration date from user ID (timestamp is in the ID)
      return users.map((user: any) => {
        const registrationDate = user.registrationDate || 
          (user.id.includes("_") ? parseInt(user.id.split("_")[1]) : Date.now());
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          registrationDate,
        };
      });
    } catch {
      return [];
    }
  },

  // Get user activity data
  getUserActivity(): UserActivity[] {
    const users = this.getAllUsers();
    const allTickets = TicketManager.getAllTickets();
    const now = Date.now();

    return users.map((user) => {
      const userTickets = allTickets.filter((t: any) => t.userId === user.id);
      const totalSpent = userTickets.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
      
      // Get last activity (last ticket purchase or registration)
      const lastTicket = userTickets.sort((a: any, b: any) => b.purchaseDate - a.purchaseDate)[0];
      const lastActivity = lastTicket?.purchaseDate || user.registrationDate || now;
      
      const daysSinceActivity = (now - lastActivity) / (24 * 60 * 60 * 1000);
      const status: "active" | "inactive" = daysSinceActivity <= 30 ? "active" : "inactive";

      return {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        registrationDate: user.registrationDate || now,
        lastActivity,
        totalTickets: userTickets.length,
        totalSpent,
        status,
      };
    });
  },

  // Get platform statistics
  getPlatformStats(): PlatformStats {
    const users = this.getAllUsers();
    const allTickets = TicketManager.getAllTickets();
    const allDraws = DrawManager.getAllDraws();
    const now = Date.now();
    
    // Date calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.getTime();
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthStart = monthAgo.getTime();

    // User statistics
    const totalUsers = users.length;
    const dailyRegistrations = users.filter((u) => 
      (u.registrationDate || 0) >= todayStart
    ).length;
    const weeklyRegistrations = users.filter((u) => 
      (u.registrationDate || 0) >= weekStart
    ).length;
    const monthlyRegistrations = users.filter((u) => 
      (u.registrationDate || 0) >= monthStart
    ).length;

    // Active users (users with activity in last 30 days)
    const activeUsers = this.getUserActivity().filter((u) => u.status === "active").length;

    // Ticket statistics
    const totalTickets = allTickets.length;
    const ticketsSoldToday = allTickets.filter((t: any) => 
      t.purchaseDate >= todayStart
    ).length;
    const ticketsSoldThisWeek = allTickets.filter((t: any) => 
      t.purchaseDate >= weekStart
    ).length;
    const ticketsSoldThisMonth = allTickets.filter((t: any) => 
      t.purchaseDate >= monthStart
    ).length;

    // Revenue statistics
    const totalRevenue = allTickets.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
    const todayRevenue = allTickets
      .filter((t: any) => t.purchaseDate >= todayStart)
      .reduce((sum: number, t: any) => sum + (t.price || 0), 0);
    const weeklyRevenue = allTickets
      .filter((t: any) => t.purchaseDate >= weekStart)
      .reduce((sum: number, t: any) => sum + (t.price || 0), 0);
    const monthlyRevenue = allTickets
      .filter((t: any) => t.purchaseDate >= monthStart)
      .reduce((sum: number, t: any) => sum + (t.price || 0), 0);

    // Draw statistics
    const totalDraws = allDraws.length;
    const completedDraws = allDraws.filter((d: any) => d.status === "completed").length;
    const pendingDraws = allDraws.filter((d: any) => d.status === "pending").length;

    // Average ticket price
    const averageTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    return {
      totalUsers,
      dailyRegistrations,
      weeklyRegistrations,
      monthlyRegistrations,
      activeUsers,
      totalTickets,
      totalRevenue,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      totalDraws,
      completedDraws,
      pendingDraws,
      averageTicketPrice,
      ticketsSoldToday,
      ticketsSoldThisWeek,
      ticketsSoldThisMonth,
    };
  },

  // Get registration trends (for charts)
  getRegistrationTrends(days: number = 30): Array<{ date: string; count: number }> {
    const users = this.getAllUsers();
    const trends: { [key: string]: number } = {};
    const now = Date.now();
    const startDate = now - (days * 24 * 60 * 60 * 1000);

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = 0;
    }

    // Count registrations per day
    users.forEach((user) => {
      if (user.registrationDate && user.registrationDate >= startDate) {
        const date = new Date(user.registrationDate);
        const dateStr = date.toISOString().split('T')[0];
        if (trends[dateStr] !== undefined) {
          trends[dateStr]++;
        }
      }
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
