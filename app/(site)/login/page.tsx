"use client";

import Window from "@/components/os/Window";
import LoginView from "@/components/portal/LoginView";

export default function LoginPage() {
  return (
    <Window title="Sign in" path="~/login" size="md">
      <LoginView />
    </Window>
  );
}
