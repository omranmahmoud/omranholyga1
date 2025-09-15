
export interface Background {
  _id: string;
  name: string;
  type: 'color' | 'gradient' | 'pattern';
  value: string;
  isActive: boolean;
}

export interface BackgroundContextType {
  activeBackground: Background | null;
  loading: boolean;
  error: string | null;
  refreshBackground: () => Promise<void>;
}

export interface BackgroundProviderProps {
  children: React.ReactNode;
}
```