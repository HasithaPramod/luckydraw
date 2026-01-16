// User lookup utility for agents
// Allows finding users by ID, phone, or email

import { User } from "@/contexts/AuthContext";

export const UserLookup = {
  // Find user by ID
  findById(userId: string): User | null {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) return null;
      
      const users: Array<User & { password?: string }> = JSON.parse(usersData);
      const user = users.find((u) => u.id === userId);
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  // Find user by phone number
  findByPhone(phone: string): User | null {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) return null;
      
      const users: Array<User & { password?: string }> = JSON.parse(usersData);
      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
      const user = users.find((u) => 
        u.phone.replace(/[\s\-\(\)]/g, "") === normalizedPhone
      );
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  // Find user by email
  findByEmail(email: string): User | null {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) return null;
      
      const users: Array<User & { password?: string }> = JSON.parse(usersData);
      const user = users.find((u) => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  // Search users by any identifier (ID, phone, or email)
  search(identifier: string): User | null {
    // Try ID first
    const byId = this.findById(identifier);
    if (byId) return byId;
    
    // Try phone
    const byPhone = this.findByPhone(identifier);
    if (byPhone) return byPhone;
    
    // Try email
    const byEmail = this.findByEmail(identifier);
    if (byEmail) return byEmail;
    
    return null;
  },
};
