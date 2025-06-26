// src/components/common/Toast.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../redux/slices/toastSlice';

export default function Toast() {
  const dispatch = useDispatch();
  const { visible, message, type } = useSelector((state) => state.toast);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => dispatch(hideToast()), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`fixed top-5 right-5 px-4 py-2 rounded text-white shadow-lg ${bgColor}`}>
      {message}
    </div>
  );
}
