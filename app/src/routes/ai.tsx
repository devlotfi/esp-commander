import { createFileRoute } from "@tanstack/react-router";
import RequiredConnectionProvider from "../provider/required-connection-provider";
import RequiredGeminiProvider from "../provider/required-gemini-provider";
import AIDasboard from "../components/ai/ai-dashboard";

export const Route = createFileRoute("/ai")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequiredConnectionProvider>
      <RequiredGeminiProvider>
        <AIDasboard></AIDasboard>
      </RequiredGeminiProvider>
    </RequiredConnectionProvider>
  );
}
