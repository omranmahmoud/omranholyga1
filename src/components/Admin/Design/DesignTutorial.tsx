import { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Palette, Layout, 
  Settings as SettingsIcon, Brush, Eye, Save
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  highlight: string;
}

interface DesignTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesignTutorial({ isOpen, onClose }: DesignTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Design Studio',
      description: 'Your complete store design solution with professional themes, drag-and-drop builder, and advanced customization tools.',
      icon: Brush,
      highlight: 'theme-designer'
    },
    {
      id: 'theme-designer',
      title: 'Theme Designer',
      description: 'Choose from pre-made themes or create custom color palettes, typography, and styles. Perfect for quick brand styling.',
      icon: Palette,
      highlight: 'theme-designer'
    },
    {
      id: 'page-builder',
      title: 'Visual Page Builder',
      description: 'Drag and drop sections to design your store layout. Customize headers, product grids, and content areas visually.',
      icon: Layout,
      highlight: 'visual-builder'
    },
    {
      id: 'design-settings',
      title: 'Advanced Settings',
      description: 'Fine-tune every detail with advanced design options, custom CSS, and responsive settings for all devices.',
      icon: SettingsIcon,
      highlight: 'design-settings'
    },
    {
      id: 'preview-save',
      title: 'Preview & Save',
      description: 'See your changes in real-time with live preview, test on different devices, and save your design when ready.',
      icon: Eye,
      highlight: 'preview'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const compleTutorial = () => {
    localStorage.setItem('design-tutorial-completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">
            {step.description}
          </p>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{currentStep + 1}/{steps.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={compleTutorial}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Get Started
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
