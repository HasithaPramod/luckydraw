import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, LogIn, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAgent, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated - useEffect imported from react
  useEffect(() => {
    if (isAuthenticated) {
      if (isAgent) {
        navigate("/agent", { replace: true });
      } else {
        const from = (location.state as { from?: string })?.from || "/";
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAgent, navigate, location]);

  const from = (location.state as { from?: string })?.from || "/";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Attempting login with:", { email: data.email });
      const success = await login(data.email.trim(), data.password);
      console.log("Login result:", success);

      if (success) {
        // Check if user is agent and redirect accordingly
        const usersData = localStorage.getItem("registeredUsers");
        if (usersData) {
          const users = JSON.parse(usersData);
          const loggedInUser = users.find((u: any) => u.email.toLowerCase() === data.email.toLowerCase());
          if (loggedInUser?.role === "agent") {
            toast({
              title: "Login Successful",
              description: "Welcome to Agent Dashboard!",
            });
            navigate("/agent", { replace: true });
            return;
          }
        }
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        navigate(from, { replace: true });
      } else {
        setError("Invalid email or password. Please try again.");
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold text-foreground">Sign In</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glow">
              <LogIn className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <p className="text-sm font-semibold text-foreground mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Regular User:</span>
                <div className="mt-1 font-mono text-xs bg-background p-2 rounded border">
                  <div>Email: <span className="text-primary">demo@example.com</span></div>
                  <div>Password: <span className="text-primary">Demo123</span></div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Admin User:</span>
                <div className="mt-1 font-mono text-xs bg-background p-2 rounded border">
                  <div>Email: <span className="text-primary">admin@example.com</span></div>
                  <div>Password: <span className="text-primary">Admin123</span></div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Agent User:</span>
                <div className="mt-1 font-mono text-xs bg-background p-2 rounded border">
                  <div>Email: <span className="text-primary">agent@example.com</span></div>
                  <div>Password: <span className="text-primary">Agent123</span></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={async () => {
                    form.setValue("email", "agent@example.com");
                    form.setValue("password", "Agent123");
                    // Auto-submit after setting values
                    setTimeout(() => {
                      form.handleSubmit(onSubmit)();
                    }, 100);
                  }}
                >
                  Use Agent Credentials & Login
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>

              {/* Register Link */}
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-primary hover:underline font-medium"
                >
                  Create an account
                </button>
              </p>
            </form>
          </Form>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LoginPage;
