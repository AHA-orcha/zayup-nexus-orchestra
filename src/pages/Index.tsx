import { useState, useCallback } from "react";
import { Zap, ArrowRight, Phone, ChevronDown } from "lucide-react";
import PizzaBolisDemo from "@/components/PizzaBolisDemo";
import LivePanel from "@/components/LivePanel";
import EmailCapture from "@/components/EmailCapture";
import { OrderItem } from "@/components/OrderSummary";
import { LogEntry } from "@/components/AdminPanel";
import { useVapi } from "@/hooks/useVapi";

const DEMO_ASSISTANT_ID = "c8951f28-76ac-4c9e-ba73-b51fb6b8af6f";

const Index = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: "SYSTEM", message: "Voice system initialized" },
    { id: "2", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: "API", message: "Backend connection established" },
  ]);
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showEmail, setShowEmail] = useState(false);
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setLogs(prev => [...prev.slice(-50), { id: Date.now().toString(), timestamp, type, message }]);
  }, []);

  const addOrderItem = useCallback((item: OrderItem) => {
    setOrderItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    addLog("MCP", `item-add: ${item.name}`);
  }, [addLog]);

  // Handle MCP function calls from Vapi
  const handleFunctionCall = useCallback((name: string, params: Record<string, unknown>) => {
    addLog("MCP", `${name} called`);

    switch (name) {
      case "add_item":
      case "add-item":
      case "addItem":
        addOrderItem({
          id: "",
          name: params.name as string || params.item_name as string,
          modification: params.modification as string,
          price: params.price as number || 0,
        });
        break;

      case "modify_item":
      case "modify-item":
      case "modifyItem":
        setOrderItems(prev => prev.map(item => 
          item.name === (params.item_name as string || params.name as string)
            ? { ...item, modification: params.modification as string }
            : item
        ));
        addLog("MCP", `Modified: ${params.item_name || params.name}`);
        break;

      case "remove_item":
      case "remove-item":
      case "removeItem":
        setOrderItems(prev => prev.filter(item => 
          item.name !== (params.item_name as string || params.name as string)
        ));
        addLog("MCP", `Removed: ${params.item_name || params.name}`);
        break;

      case "capture_email":
      case "capture-email":
      case "captureEmail":
      case "show_email":
      case "showEmail":
      case "trigger_email_input":
        setShowEmail(true);
        addLog("MCP", "Email capture triggered");
        break;

      case "place_order":
      case "place-order":
      case "placeOrder":
      case "submit_order":
      case "submitOrder":
      case "order-validate":
        addLog("API", "Order validated & submitted");
        addLog("SYSTEM", "Sending receipt email...");
        break;

      case "switch_to_demo":
      case "switchToDemo":
      case "transfer_to_demo":
        addLog("SYSTEM", "Switching to demo agent...");
        break;

      case "menu-export":
      case "menuExport":
        addLog("MCP", "Menu data exported to agent");
        break;

      default:
        addLog("MCP", `Function: ${name}`);
    }
  }, [addOrderItem, addLog]);

  const { status, startCall, stopCall } = useVapi({
    onCallStart: () => {
      addLog("SYSTEM", "Connected to Ava");
      setTranscript([]);
    },
    onCallEnd: () => {
      addLog("SYSTEM", "Call ended");
    },
    onSpeechStart: () => {},
    onSpeechEnd: () => {
      addLog("SYSTEM", "Processing speech...");
    },
    onFunctionCall: handleFunctionCall,
    onMessage: (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript || "";
        if (text.trim()) {
          setTranscript(prev => [...prev.slice(-20), { role: message.role as "user" | "assistant", text }]);
          if (message.role === "assistant") {
            addLog("API", `Ava: ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}`);
          } else {
            addLog("API", `User: ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}`);
          }
        }
      }
    },
    onError: (error) => {
      addLog("SYSTEM", `Error: ${error.message}`);
    },
  });

  const handleStartCall = useCallback(() => {
    setIsDemoExpanded(true);
    startCall(DEMO_ASSISTANT_ID);
    addLog("SYSTEM", "Initiating connection...");
  }, [startCall, addLog]);

  const handleStopCall = useCallback(() => {
    stopCall();
    setOrderItems([]);
    setShowEmail(false);
  }, [stopCall]);

  const isActive = status !== "idle";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 backdrop-blur-md bg-background/80 border-b border-border/30">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground tracking-tight">
              Zayup
            </span>
          </div>

          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors">
            Join Waitlist
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-8 md:pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 md:mb-8">
            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">Coming Soon</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Your AI Phone Operator
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 md:mb-12 leading-relaxed">
            Never miss an order again. Our voice AI answers calls, takes orders, 
            and sends them straight to your kitchen — 24/7.
          </p>

          {/* Scroll indicator */}
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <span className="text-xs md:text-sm">See it in action</span>
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-8 md:py-16 px-4 md:px-6" id="demo">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-sm md:text-base text-muted-foreground">
              Tap below to test a live ordering demo
            </p>
          </div>

          {/* Pizza Bolis Demo Window */}
          <div className="flex justify-center">
            <PizzaBolisDemo
              isExpanded={isDemoExpanded}
              isActive={isActive}
              status={status}
              orderItems={orderItems}
              onStart={handleStartCall}
              onStop={handleStopCall}
            />
          </div>

          {/* Email Capture Overlay */}
          {showEmail && (
            <div className="mt-6 flex justify-center">
              <EmailCapture isVisible={showEmail} />
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
            Stop losing orders to missed calls.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
            We're onboarding a limited number of restaurants for early access.
          </p>
          <button className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            <span className="text-sm md:text-base">Join the Waitlist</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 md:px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Zayup</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Zayup Inc.
          </p>
        </div>
      </footer>

      {/* Live Panel - Desktop only, shows during active call */}
      <div className="hidden lg:block">
        <LivePanel
          orderItems={orderItems}
          logs={logs}
          isVisible={isActive}
          transcript={transcript}
        />
      </div>
    </div>
  );
};

export default Index;
