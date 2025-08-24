import { SmashSetup } from "@/components/auth/smashSetup";

export default function PatternSetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg mx-auto p-6">
        <SmashSetup />
      </div>
    </div>
  );
}
