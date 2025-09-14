import { useState } from 'react';

interface Condition {
  type: 'min_weight' | 'max_weight' | 'min_price' | 'max_price';
  value: number;
}

export function useRateConditions(initialConditions: Condition[] = []) {
  const [conditions, setConditions] = useState<Condition[]>(initialConditions);

  const addCondition = (condition: Condition) => {
    // Check for duplicate condition type
    if (conditions.some(c => c.type === condition.type)) {
      throw new Error(`A ${condition.type} condition already exists`);
    }

    // Validate min/max relationships
    if (condition.type === 'max_weight') {
      const minWeight = conditions.find(c => c.type === 'min_weight');
      if (minWeight && condition.value <= minWeight.value) {
        throw new Error('Maximum weight must be greater than minimum weight');
      }
    }

    if (condition.type === 'max_price') {
      const minPrice = conditions.find(c => c.type === 'min_price');
      if (minPrice && condition.value <= minPrice.value) {
        throw new Error('Maximum price must be greater than minimum price');
      }
    }

    setConditions(prev => [...prev, condition]);
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updatedCondition: Condition) => {
    setConditions(prev => prev.map((condition, i) => 
      i === index ? updatedCondition : condition
    ));
  };

  const validateConditions = (): string[] => {
    const errors: string[] = [];

    // Check for negative values
    conditions.forEach(condition => {
      if (condition.value < 0) {
        errors.push(`${condition.type} cannot be negative`);
      }
    });

    // Check min/max relationships
    const minWeight = conditions.find(c => c.type === 'min_weight');
    const maxWeight = conditions.find(c => c.type === 'max_weight');
    if (minWeight && maxWeight && maxWeight.value <= minWeight.value) {
      errors.push('Maximum weight must be greater than minimum weight');
    }

    const minPrice = conditions.find(c => c.type === 'min_price');
    const maxPrice = conditions.find(c => c.type === 'max_price');
    if (minPrice && maxPrice && maxPrice.value <= minPrice.value) {
      errors.push('Maximum price must be greater than minimum price');
    }

    return errors;
  };

  return {
    conditions,
    addCondition,
    removeCondition,
    updateCondition,
    validateConditions
  };
}
