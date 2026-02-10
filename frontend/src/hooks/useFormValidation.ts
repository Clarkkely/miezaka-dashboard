import { useState, useCallback } from 'react';

// Types pour la validation
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'array' | 'email';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FieldConfig {
  value: any;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'array' | 'email';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export interface TouchedFields {
  [key: string]: boolean;
}

// Hook personnalisé pour la validation de formulaire
export const useFormValidation = (initialFields: { [key: string]: FieldConfig }) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [values, setValues] = useState<{ [key: string]: any }>(
    Object.keys(initialFields).reduce((acc, key) => {
      acc[key] = initialFields[key].value;
      return acc;
    }, {} as { [key: string]: any })
  );

  // Règles de validation communes
  const validationRules = {
    required: (value: any, fieldName: string) => {
      if (value === null || value === undefined || value === '') {
        return `${fieldName} est requis`;
      }
      if (Array.isArray(value) && value.length === 0) {
        return `${fieldName} doit contenir au moins un élément`;
      }
      return null;
    },

    string: (value: any) => {
      if (value && typeof value !== 'string') {
        return 'Doit être une chaîne de caractères';
      }
      return null;
    },

    number: (value: any) => {
      if (value && isNaN(Number(value))) {
        return 'Doit être un nombre';
      }
      return null;
    },

    date: (value: any) => {
      if (value && !(value instanceof Date) && isNaN(Date.parse(value))) {
        return 'Doit être une date valide';
      }
      return null;
    },

    array: (value: any) => {
      if (value && !Array.isArray(value)) {
        return 'Doit être une liste';
      }
      return null;
    },

    email: (value: any) => {
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Adresse email invalide';
        }
      }
      return null;
    },

    min: (value: any, min: number) => {
      if (value !== null && value !== undefined && Number(value) < min) {
        return `Doit être au moins ${min}`;
      }
      return null;
    },

    max: (value: any, max: number) => {
      if (value !== null && value !== undefined && Number(value) > max) {
        return `Doit être au maximum ${max}`;
      }
      return null;
    },

    minLength: (value: any, minLength: number) => {
      if (value && value.length < minLength) {
        return `Doit contenir au moins ${minLength} caractères`;
      }
      return null;
    },

    maxLength: (value: any, maxLength: number) => {
      if (value && value.length > maxLength) {
        return `Doit contenir au maximum ${maxLength} caractères`;
      }
      return null;
    },

    pattern: (value: any, pattern: RegExp) => {
      if (value && !pattern.test(value)) {
        return 'Format invalide';
      }
      return null;
    },
  };

  // Fonction de validation d'un champ
  const validateField = useCallback((fieldName: string): boolean => {
    const fieldConfig = initialFields[fieldName];
    if (!fieldConfig) return true;

    const value = values[fieldName];
    const rules = fieldConfig;
    let error: string | null = null;

    // Validation requise
    if (rules.required) {
      error = validationRules.required(value, fieldName);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Si la valeur est vide et non requise, pas d'erreur
    if (!rules.required && (value === null || value === undefined || value === '')) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
      return true;
    }

    // Validation de type
    if (rules.type) {
      error = validationRules[rules.type](value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation de longueur minimale
    if (rules.minLength !== undefined) {
      error = validationRules.minLength(value, rules.minLength);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation de longueur maximale
    if (rules.maxLength !== undefined) {
      error = validationRules.maxLength(value, rules.maxLength);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation de valeur minimale
    if (rules.min !== undefined) {
      error = validationRules.min(value, rules.min);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation de valeur maximale
    if (rules.max !== undefined) {
      error = validationRules.max(value, rules.max);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation par pattern
    if (rules.pattern) {
      error = validationRules.pattern(value, rules.pattern);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Validation personnalisée
    if (rules.custom) {
      error = rules.custom(value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    // Aucune erreur
    setErrors(prev => ({ ...prev, [fieldName]: null }));
    return true;
  }, [values, initialFields]);

  // Fonction de validation de tous les champs
  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const newTouched: TouchedFields = {};

    Object.keys(initialFields).forEach(fieldName => {
      newTouched[fieldName] = true;
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });

    setTouched(newTouched);
    return isValid;
  }, [validateField, initialFields]);

  // Fonction pour définir la valeur d'un champ
  const setValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  // Fonction pour marquer un champ comme touché
  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Vérifier si le formulaire est valide
  const isValid = Object.values(errors).every(error => error === null);

  return {
    errors,
    touched,
    values,
    validateField,
    validateAll,
    setValue,
    touchField,
    isValid,
  };
};