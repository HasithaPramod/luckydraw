import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nic: string;
  role: "user" | "admin" | "agent";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, "id" | "role"> & { password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize demo users and load user from localStorage on mount
  useEffect(() => {
    // Initialize or update demo users
    const usersData = localStorage.getItem("registeredUsers");
    const demoUsers: Array<User & { password: string; registrationDate: number }> = [
      {
        id: "demo_user_1",
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        phone: "+94771234567",
        nic: "123456789V",
        role: "user",
        password: "Demo123",
        registrationDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: "demo_admin_1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        phone: "+94771234568",
        nic: "987654321V",
        role: "admin",
        password: "Admin123",
        registrationDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: "demo_agent_1",
        email: "agent@example.com",
        firstName: "Cash",
        lastName: "Agent",
        phone: "+94771234569",
        nic: "111222333V",
        role: "agent",
        password: "Agent123",
        registrationDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
    ];

    if (!usersData) {
      // No users exist, create all demo users
      localStorage.setItem("registeredUsers", JSON.stringify(demoUsers));
    } else {
      // Users exist, check if agent is missing and add it
      try {
        const existingUsers: Array<User & { password: string; registrationDate?: number }> = JSON.parse(usersData);
        const hasAgent = existingUsers.some((u) => u.id === "demo_agent_1" || u.email === "agent@example.com");
        
        if (!hasAgent) {
          // Add agent user to existing users
          existingUsers.push(demoUsers[2]); // Add agent user
          localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));
          console.log("Added missing agent user to localStorage");
        }
      } catch (error) {
        console.error("Error checking/updating users:", error);
        // If parsing fails, reset with all demo users
        localStorage.setItem("registeredUsers", JSON.stringify(demoUsers));
      }
    }

    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    const storedAuth = localStorage.getItem("isAuthenticated");
    
    if (storedUser && storedAuth === "true") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Get all registered users from localStorage
      const usersData = localStorage.getItem("registeredUsers");
      if (!usersData) {
        console.error("No registered users found in localStorage");
        // Initialize demo users if they don't exist
        const demoUsers: Array<User & { password: string; registrationDate: number }> = [
          {
            id: "demo_user_1",
            email: "demo@example.com",
            firstName: "Demo",
            lastName: "User",
            phone: "+94771234567",
            nic: "123456789V",
            role: "user",
            password: "Demo123",
            registrationDate: Date.now() - (7 * 24 * 60 * 60 * 1000),
          },
          {
            id: "demo_admin_1",
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
            phone: "+94771234568",
            nic: "987654321V",
            role: "admin",
            password: "Admin123",
            registrationDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
          },
          {
            id: "demo_agent_1",
            email: "agent@example.com",
            firstName: "Cash",
            lastName: "Agent",
            phone: "+94771234569",
            nic: "111222333V",
            role: "agent",
            password: "Agent123",
            registrationDate: Date.now() - (15 * 24 * 60 * 60 * 1000),
          },
        ];
        localStorage.setItem("registeredUsers", JSON.stringify(demoUsers));
        // Retry login after initializing
        const foundUser = demoUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem("user", JSON.stringify(userWithoutPassword));
          localStorage.setItem("isAuthenticated", "true");
          return true;
        }
        return false;
      }

      const users: Array<User & { password: string }> = JSON.parse(usersData);
      
      // Check if agent user is missing and add it
      const hasAgent = users.some((u) => u.id === "demo_agent_1" || u.email === "agent@example.com");
      if (!hasAgent) {
        const agentUser: User & { password: string; registrationDate: number } = {
          id: "demo_agent_1",
          email: "agent@example.com",
          firstName: "Cash",
          lastName: "Agent",
          phone: "+94771234569",
          nic: "111222333V",
          role: "agent",
          password: "Agent123",
          registrationDate: Date.now() - (15 * 24 * 60 * 60 * 1000),
        };
        users.push(agentUser);
        localStorage.setItem("registeredUsers", JSON.stringify(users));
        console.log("Added missing agent user during login");
      }
      
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        localStorage.setItem("isAuthenticated", "true");
        return true;
      }

      console.error("User not found or password incorrect", { email, usersCount: users.length, userEmails: users.map(u => u.email) });
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    userData: Omit<User, "id" | "role"> & { password: string; role?: "user" | "admin" | "agent" }
  ): Promise<boolean> => {
    try {
      // Get existing users
      const usersData = localStorage.getItem("registeredUsers");
      const users: Array<User & { password: string; registrationDate?: number }> = usersData
        ? JSON.parse(usersData)
        : [];

      // Check if email already exists
      if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return false;
      }

      // Create new user with registration date
      const newUser: User & { password: string; registrationDate: number } = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...userData,
        role: userData.role || "user", // Default role is user, but can be set to admin
        registrationDate: Date.now(), // Track registration date
      };

      // Add to users array
      users.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(users));

      // Auto-login after registration
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      localStorage.setItem("isAuthenticated", "true");

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isAgent = user?.role === "agent";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isAgent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
