import React, { useState, useCallback, useRef } from 'react';

export function useForm({ defaultValues = {} } = {}) {
  const [values, setValues] = useState(defaultValues);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const initialValuesRef = useRef(defaultValues);

  const setValue = useCallback((name, value, options = {}) => {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      const isCurrentlyDirty = Object.keys(next).some(
        key => next[key] !== initialValuesRef.current[key]
      );
      setIsDirty(isCurrentlyDirty);
      return next;
    });
  }, []);

  const getValues = useCallback((name) => {
    if (name) return values[name];
    return values;
  }, [values]);

  const reset = useCallback((newValues) => {
    const vals = newValues || initialValuesRef.current;
    initialValuesRef.current = vals;
    setValues(vals);
    setIsDirty(false);
    setErrors({});
  }, []);

  const watch = useCallback((name) => {
    if (name) return values[name];
    return values;
  }, [values]);

  const handleSubmit = useCallback((onSubmit) => {
    return (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      onSubmit(values);
    };
  }, [values]);

  const control = {
    values,
    setValue,
    errors,
    setErrors
  };

  return {
    control,
    handleSubmit,
    setValue,
    reset,
    getValues,
    watch,
    formState: { isDirty, errors }
  };
}

export function Controller({ name, control, render }) {
  const value = control.values[name];
  const onChange = useCallback((val) => {
    let finalValue = val;
    if (val && val.target) {
      if (val.target.type === 'checkbox') {
        finalValue = val.target.checked;
      } else {
        finalValue = val.target.value;
      }
    }
    control.setValue(name, finalValue);
  }, [name, control]);

  const field = {
    name,
    value: value !== undefined ? value : '',
    onChange,
    onBlur: () => {},
    ref: () => {}
  };

  const fieldState = {
    error: control.errors[name],
    invalid: !!control.errors[name],
    isDirty: false,
    isTouched: false
  };

  return render({ field, fieldState });
}
