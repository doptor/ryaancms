import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signIn(form.get("email") as string, form.get("password") as string);
      toast({ title: "Welcome back!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({ title: "Please accept the Terms & Conditions", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signUp(form.get("email") as string, password, form.get("displayName") as string);
      toast({ title: "Account created!", description: "Check your email to confirm your account." });
    } catch (err: any) {
      toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({ title: "Please enter your email", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent!", description: "Check your email for a password reset link." });
      setShowForgot(false);
      setForgotEmail("");
    } catch (err: any) {
      toast({ title: "Failed to send reset link", description: err.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">RyaanCMS</span>
        </div>

        <Card>
          <Tabs defaultValue="signin">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to your account to continue</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signin-email" name="email" type="email" placeholder="you@example.com" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signin-password" name="password" type="password" placeholder="••••••••" className="pl-9" required />
                    </div>
                  </div>
                  <Dialog open={showForgot} onOpenChange={setShowForgot}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                        <Button onClick={handleForgotPassword} className="w-full" disabled={forgotLoading}>
                          {forgotLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>Get started with RyaanCMS</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" name="displayName" placeholder="Your name" className="pl-9" maxLength={100} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" name="email" type="email" placeholder="you@example.com" className="pl-9" maxLength={255} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" name="password" type="password" placeholder="••••••••" className="pl-9" minLength={6} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-confirm" name="confirmPassword" type="password" placeholder="••••••••" className="pl-9" minLength={6} required />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(v) => setAcceptedTerms(v === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-5">
                      I accept the{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-primary hover:underline">Terms & Conditions</button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Terms & Conditions</DialogTitle></DialogHeader>
                          <div className="text-sm text-muted-foreground space-y-3 pt-2">
                            <p>By creating an account and using RyaanCMS, you agree to the following terms:</p>
                            <p><strong>1. Account Responsibility</strong> — You are responsible for maintaining the security of your account credentials.</p>
                            <p><strong>2. Acceptable Use</strong> — You agree to use the platform only for lawful purposes and in accordance with applicable laws.</p>
                            <p><strong>3. Content Ownership</strong> — You retain ownership of all content you create. RyaanCMS does not claim ownership of your data.</p>
                            <p><strong>4. Service Availability</strong> — We strive for high uptime but do not guarantee uninterrupted service.</p>
                            <p><strong>5. Termination</strong> — We reserve the right to suspend accounts that violate these terms.</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {" "}and{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-primary hover:underline">Privacy Policy</button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Privacy Policy</DialogTitle></DialogHeader>
                          <div className="text-sm text-muted-foreground space-y-3 pt-2">
                            <p>RyaanCMS is committed to protecting your privacy. This policy outlines how we handle your data:</p>
                            <p><strong>1. Data Collection</strong> — We collect only the information necessary to provide the service, including your email and display name.</p>
                            <p><strong>2. Data Usage</strong> — Your data is used solely for authentication, personalization, and service improvement.</p>
                            <p><strong>3. Data Storage</strong> — All data is stored securely with encryption at rest and in transit.</p>
                            <p><strong>4. Third Parties</strong> — We do not sell or share your personal information with third parties.</p>
                            <p><strong>5. Your Rights</strong> — You may request deletion of your account and associated data at any time.</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
