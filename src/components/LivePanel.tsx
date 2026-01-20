import { ShoppingCart, MessageSquare } from "lucide-react";
import { OrderItem } from "./OrderSummary";
import { useRef, useEffect } from "react";

interface LivePanelProps {
  orderItems: OrderItem[];
  isVisible: boolean;
  transcript?: { role: "user" | "assistant"; text: string }[];
}

const LivePanel = ({ orderItems, isVisible, transcript = [] }: LivePanelProps) => {
  const total = orderItems.reduce((sum, item) => sum + item.price, 0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="fixed right-4 top-20 bottom-4 w-80 flex flex-col gap-3 z-40">
      {/* Order Summary Card - Only show when there's a call or items */}
      {(isVisible || orderItems.length > 0) && (
        <div className="bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Live Order</span>
            {orderItems.length > 0 && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {orderItems.length}
              </span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto">
            {orderItems.length === 0 ? (
              <div className="px-4 py-4 text-center text-muted-foreground text-xs">
                Order items appear here
              </div>
            ) : (
              orderItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2 border-b border-border/20 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {item.modification && (
                        <p className="text-xs text-muted-foreground">{item.modification}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">${item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {orderItems.length > 0 && (
            <div className="px-4 py-2 bg-primary/10 border-t border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcript Card - Show during call */}
      {isVisible && (
        <div className="bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Transcript</span>
          </div>

          <div className="max-h-48 overflow-y-auto p-3 space-y-2">
            {transcript.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-2">
                Conversation will appear here...
              </div>
            ) : (
              transcript.slice(-10).map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${
                    msg.role === "user" 
                      ? "bg-secondary/50 text-foreground" 
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <span className="font-medium">{msg.role === "user" ? "You" : "Ava"}:</span>{" "}
                  {msg.text}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePanel;
