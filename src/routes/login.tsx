import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, getHttpStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in · Student Management System" },
      { name: "description", content: "Sign in to manage student records." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      setPassword("");
      void navigate({ to: "/", replace: true });
    } catch (loginError) {
      setError(
        getHttpStatus(loginError) === 401
          ? "The email or password is incorrect. Check your details and try again."
          : getApiErrorMessage(loginError),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-ambient opacity-80" />
      <Card className="relative w-full max-w-md animate-fade-up border-border bg-card/95 shadow-elevated backdrop-blur">
        <CardHeader className="items-center space-y-4 pb-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary">
            <GraduationCap className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl tracking-tight">Admin sign in</CardTitle>
            <CardDescription>Sign in to access the Student Management System.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                maxLength={256}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className="pr-11"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error ? (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="premium" className="h-10 w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-subtle-foreground">
              <ShieldCheck className="size-3.5" /> Admin access only
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
