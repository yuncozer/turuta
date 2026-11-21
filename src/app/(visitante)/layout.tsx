import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";
import { SoftGateProvider } from "@/components/soft-gate";

export default function VisitorLayout({ children }: LayoutProps<"/">) {
  return (
    <SoftGateProvider>
      <div className="mx-auto min-h-dvh max-w-md bg-canvas pb-20 shadow-sm">
        <DemoBanner />
        {children}
        <BottomNav />
      </div>
    </SoftGateProvider>
  );
}
