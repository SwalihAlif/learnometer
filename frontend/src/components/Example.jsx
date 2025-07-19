// src/components/Example.jsx
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const Example = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-pink-100 p-6 relative overflow-hidden">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={400}
        recycle={false} // confetti falls once
      />

      <h1 className="text-3xl font-bold text-green-700 mt-4 text-center">
        🎉 Congratulations!
      </h1>
      <p className="text-gray-700 mt-2 text-center">
        You’ve successfully registered. Enter the OTP sent to your email to complete login.
      </p>
    </div>
  );
};

export default Example;
