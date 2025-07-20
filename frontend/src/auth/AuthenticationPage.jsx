import "react";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function AuthenticationPage() {
  return <div className="auth-container">
    <SignedOut>
        <SignIn routing="path" path="/sign-in" />
        <SignUp routing="path" path="/sign-up" />
    </SignedOut>
    <SignedIn>
        <Navigate to="/app" replace />
    </SignedIn>
  </div>
}
