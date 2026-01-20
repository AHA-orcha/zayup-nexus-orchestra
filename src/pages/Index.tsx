import { useState, useCallback } from "react";
import { Radio, Zap, ArrowRight, Phone, Shield, BarChart3, Cpu, ChevronDown } from "lucide-react";
import PizzaBolisDemo from "@/components/PizzaBolisDemo";
import LivePanel from "@/components/LivePanel";
import EmailCapture from "@/components/EmailCapture";
import { OrderItem } from "@/components/OrderSummary";
import { LogEntry } from "@/components/AdminPanel";
import { useVapi } from "@/hooks/useVapi";

// Your Vapi Assistant IDs
const INTRO_ASSISTANT_ID = ""; // Zayup intro bot (add ID when ready)
const DEMO_ASSISTANT_ID = "c8951f28-76ac-4c9e-ba73-b51fb6b8af6f"; // Demo bot with MCP tools

const Index = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: "SYSTEM", message: "Voice system initialized" },
    { id: "2", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: "API", message: "Backend connection established" },
  ]);
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showEmail, setShowEmail] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState<"intro" | "demo">("demo");
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
        setCurrentAssistant("demo");
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
      addLog("SYSTEM", `Connected to ${currentAssistant === "intro" ? "Zayup AI" : "Ava"}`);
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
    const assistantId = currentAssistant === "intro" && INTRO_ASSISTANT_ID 
      ? INTRO_ASSISTANT_ID 
      : DEMO_ASSISTANT_ID;
    startCall(assistantId);
    addLog("SYSTEM", "Initiating connection...");
  }, [currentAssistant, startCall, addLog]);

  const handleStopCall = useCallback(() => {
    stopCall();
    setOrderItems([]);
    setShowEmail(false);
  }, [stopCall]);

  const handleDemoClick = () => {
    if (!isDemoExpanded) {
      setIsDemoExpanded(true);
    }
  };

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
            <div>
              <span className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                Zayup<span className="text-primary">OS</span>
              </span>
              <p className="text-[10px] md:text-xs text-muted-foreground">Voice Adapter</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Live Demo Badge */}
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <Radio className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
              <span className="text-[10px] md:text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-8 md:pb-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 md:mb-8">
            <Cpu className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">PoS Voice Automation</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Transform Your Restaurant
            <br />
            <span className="text-primary">With Voice AI</span>
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
            ZayupOS connects directly to your existing PoS system, automating phone orders 
            with natural voice AI. Real orders. Real backend. Zero friction.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-16 px-4">
            {[
              { icon: Phone, label: "24/7 Voice Orders" },
              { icon: Shield, label: "Secure Integration" },
              { icon: BarChart3, label: "Real-time Analytics" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-secondary/50 border border-border/50"
              >
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span className="text-xs md:text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <span className="text-xs md:text-sm">Try the live demo</span>
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-8 md:py-16 px-4 md:px-6" id="demo">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Experience It Live</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              This demo connects to a real restaurant backend. 
              Place an order and watch it flow through our system.
            </p>
          </div>

          {/* Pizza Bolis Demo Window */}
          <div 
            className="flex justify-center"
            onClick={handleDemoClick}
          >
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

      {/* How It Works */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-16">How ZayupOS Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "01",
                title: "Connect Your PoS",
                description: "Seamless integration with your existing point-of-sale system in minutes.",
              },
              {
                step: "02",
                title: "AI Handles Calls",
                description: "Natural voice AI takes orders, handles modifications, and confirms details.",
              },
              {
                step: "03",
                title: "Orders Flow Through",
                description: "Orders appear in your PoS instantly, ready for your kitchen to prepare.",
              },
            ].map(({ step, title, description }) => (
              <div
                key={step}
                className="relative p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-4xl md:text-5xl font-bold text-primary/20">{step}</span>
                <h3 className="text-lg md:text-xl font-semibold mt-4 mb-2">{title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Ready to Automate Your Orders?</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
            Join restaurants already using ZayupOS to handle phone orders 24/7.
          </p>
          <button className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            <span className="text-sm md:text-base">Get Started</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 md:px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">ZayupOS</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 Zayup. Voice-first PoS automation.
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
