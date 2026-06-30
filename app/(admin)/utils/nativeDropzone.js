import { useState, useCallback, useRef } from 'react';

export function useDropzone({ onDrop, accept }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFiles = useCallback((files) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      onDrop(filesArray);
    }
  }, [onDrop]);

  const onDropHandler = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const onChange = useCallback((e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const getRootProps = useCallback((props = {}) => ({
    onDragOver,
    onDragLeave,
    onDrop: onDropHandler,
    onClick,
    ...props
  }), [onDragOver, onDragLeave, onDropHandler, onClick]);

  const acceptString = accept ? Object.keys(accept).join(',') : undefined;

  const getInputProps = useCallback((props = {}) => ({
    type: 'file',
    style: { display: 'none' },
    accept: acceptString,
    onChange,
    ref: fileInputRef,
    ...props
  }), [acceptString, onChange]);

  return {
    getRootProps,
    getInputProps,
    isDragActive
  };
}
