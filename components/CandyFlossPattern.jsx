import React from 'react';

const CandyFlossPattern = () => {
  return (
    <>
      <style>{`
        @keyframes float1 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 15px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float3 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(25px, 10px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float4 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -15px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e9 50%, #4caf50 100%)',
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        {/* Animated Circle 1 */}
        <div
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '10%',
            left: '10%',
            animation: 'float1 8s ease-in-out infinite',
          }}
        />

        {/* Animated Circle 2 */}
        <div
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '30%',
            right: '15%',
            animation: 'float2 10s ease-in-out infinite',
          }}
        />

        {/* Animated Circle 3 */}
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(100, 200, 120, 0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            bottom: '20%',
            left: '20%',
            animation: 'float3 12s ease-in-out infinite',
          }}
        />

        {/* Animated Circle 4 */}
        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(76, 175, 80, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            bottom: '10%',
            right: '10%',
            animation: 'float4 11s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}

export default CandyFlossPattern;
