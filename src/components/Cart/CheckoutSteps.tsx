import { CreditCard, Truck } from 'lucide-react';

interface CheckoutStepsProps {
  currentStep: 'shipping' | 'payment';
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const steps = [
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard }
  ];

  return (
    <div className="flex gap-2 px-8 py-4 bg-gray-50 overflow-x-auto">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div 
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-gray-300"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}