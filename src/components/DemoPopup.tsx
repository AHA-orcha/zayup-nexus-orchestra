import { useState } from "react";
import { Phone, Mic, ShoppingCart, Pizza, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderStep {
  id: number;
  label: string;
  status: "pending" | "active" | "complete";
}

interface DemoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRealDemo: () => void;
}

const DemoPopup = ({ isOpen, onClose, onStartRealDemo }: DemoPopupProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [cartItems, setCartItems] = useState<string[]>([]);

  const steps: OrderStep[] = [
    { id: 1, label: "Call Connected", status: currentStep > 0 ? "complete" : currentStep === 0 && isSimulating ? "active" : "pending" },
    { id: 2, label: "Taking Order", status: currentStep > 1 ? "complete" : currentStep === 1 ? "active" : "pending" },
    { id: 3, label: "Confirming Details", status: currentStep > 2 ? "complete" : currentStep === 2 ? "active" : "pending" },
    { id: 4, label: "Order Placed", status: currentStep >= 3 ? "complete" : "pending" },
  ];

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setCurrentStep(0);
    setCartItems([]);

    // Step 1: Call connected
    setTimeout(() => {
      setCurrentStep(1);
      setCartItems(["Large Pepperoni Pizza"]);
    }, 1200);

    // Step 2: Add more items
    setTimeout(() => {
      setCartItems(prev => [...prev, "Garlic Bread"]);
    }, 2000);

    // Step 3: Confirming
    setTimeout(() => {
      setCurrentStep(2);
      setCartItems(prev => [...prev, "2L Coke"]);
    }, 2800);

    // Step 4: Complete
    setTimeout(() => {
      setCurrentStep(3);
    }, 3800);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setCurrentStep(0);
    setCartItems([]);
  };

  const handleTryReal = () => {
    onClose();
    onStartRealDemo();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-bolis-cream to-white border-2 border-bolis-orange p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-bolis-red via-bolis-orange to-bolis-yellow p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-bolis-cream flex items-center justify-center">
                <Pizza className="w-5 h-5 text-bolis-orange" />
              </div>
              <div>
                <span className="text-lg font-bold drop-shadow-md">Pizza Boli's</span>
                <p className="text-xs text-white/80 font-normal">Order Simulation</p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5">
          {/* Steps Progress */}
          <div className="space-y-3 mb-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${step.status === "complete" 
                      ? "bg-green-500 text-white" 
                      : step.status === "active" 
                        ? "bg-bolis-orange text-white animate-pulse" 
                        : "bg-bolis-brown/20 text-bolis-brown/50"
                    }
                  `}
                >
                  {step.status === "complete" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${step.status === "complete" 
                      ? "text-green-600" 
                      : step.status === "active" 
                        ? "text-bolis-orange" 
                        : "text-bolis-brown/50"
                    }
                  `}
                >
                  {step.label}
                </span>
                {step.status === "active" && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-bolis-orange animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-bolis-orange animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-bolis-orange animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cart Preview */}
          <div className="bg-white rounded-xl border border-bolis-orange/20 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-bolis-orange" />
              <span className="text-sm font-semibold text-bolis-brown">Order Preview</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {cartItems.length === 0 ? (
                <p className="text-xs text-bolis-brown/40 text-center py-3">
                  Items will appear here...
                </p>
              ) : (
                cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-bolis-brown animate-fade-in"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-bolis-orange" />
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isSimulating ? (
              <button
                onClick={handleStartSimulation}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-bolis-orange to-bolis-yellow text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" />
                Start Simulation
              </button>
            ) : currentStep >= 3 ? (
              <>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border-2 border-bolis-orange/30 text-bolis-brown font-medium hover:bg-bolis-orange/5 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleTryReal}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-bolis-orange to-bolis-yellow text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  <Mic className="w-4 h-4" />
                  Try Real Demo
                </button>
              </>
            ) : (
              <div className="flex-1 py-3 text-center text-sm text-bolis-brown/60">
                Simulating order flow...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoPopup;
