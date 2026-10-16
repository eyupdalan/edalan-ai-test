import { ScreenCodeBar } from "@/components/banking/screen-code-bar";
import { ScenarioProvider } from "@/components/tour/scenario-provider";

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  return <ScenarioProvider toolbar={<ScreenCodeBar />}>{children}</ScenarioProvider>;
}
