import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    try {
      setError(null);
      setNotice(null);
      if (mode === "login") {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password, username);
        if (result.needsEmailConfirmation) {
          setNotice("Account created. Confirm the email in Supabase or disable email confirmation for local development, then log in.");
          setMode("login");
          return;
        }
      }
      navigate("/");
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Authentication failed";
      setError(authMessage(message));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border bg-zinc-950 p-6">
        <h1 className="mb-6 text-2xl font-semibold">{mode === "login" ? "Login" : "Create account"}</h1>
        <div className="space-y-4">
          {mode === "signup" && <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username for your profile" className="w-full rounded-md border bg-zinc-900 px-3 py-2" />}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email address, not username" className="w-full rounded-md border bg-zinc-900 px-3 py-2" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" className="w-full rounded-md border bg-zinc-900 px-3 py-2" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}
          <button type="button" onClick={submit} className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">
            {mode === "login" ? "Login" : "Sign up"}
          </button>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-sm text-zinc-400 hover:text-white">
            {mode === "login" ? "Need an account?" : "Already have an account?"}
          </button>
        </div>
      </div>
    </div>
  );
};

const authMessage = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password. Use the email address you signed up with, not the username.";
  }
  if (lower.includes("email not confirmed")) {
    return "Email is not confirmed yet. Confirm it in Supabase Auth, or disable email confirmation for local development.";
  }
  return message;
};
