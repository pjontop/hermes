'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function ChatPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <img
            src="/hermes.svg"
            alt="Hermes Logo"
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-3xl font-bold">Welcome to Chat</h1>
            <p className="text-muted-foreground">Hello, {user.name}!</p>
          </div>
        </div>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chat Interface</h2>
        <p className="text-muted-foreground">
          This is a protected page. You can only see this because you&rsquo;re authenticated.
        </p>
        <div className="mt-4 p-4 bg-muted rounded">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name}</p>
        </div>
      </div>
    </div>
  );
}
