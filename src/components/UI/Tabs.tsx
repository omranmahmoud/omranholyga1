import React from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <div className="space-y-6">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue: value,
            onValueChange
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, selectedValue, onValueChange }: TabsListProps & { selectedValue?: string; onValueChange?: (value: string) => void }) {
  return (
    <div className="flex gap-2 border-b border-gray-200">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue,
            onValueChange
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, selectedValue, onValueChange, children }: TabsTriggerProps & { selectedValue?: string; onValueChange?: (value: string) => void }) {
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        value === selectedValue
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, selectedValue, children }: TabsContentProps & { selectedValue?: string }) {
  if (value !== selectedValue) return null;
  
  return (
    <div className="py-6">
      {children}
    </div>
  );
}
