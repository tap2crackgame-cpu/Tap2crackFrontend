// Tap2Crack - Application Entry Point
// Redirects all traffic to the welcome screen

import { Redirect } from "expo-router";

/**
 * Root index component - redirects to welcome
 */
export default function Tap2CrackIndex() {
  return <Redirect href="/welcome" />;
}
