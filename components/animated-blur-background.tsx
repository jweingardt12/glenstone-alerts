"use client";

export function AnimatedBlurBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Enhanced animated gradient blobs with more dynamic movement and effects */}
      <div className="absolute inset-0">
        {/* Large Base Blobs with enhanced gradients and effects */}
        {/* Blob 1 - Vibrant Pink/Coral with shimmer */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #FFD0E0 0%, #FFB8C8 25%, #FF9BB0 60%, #FF7090 100%)',
            top: '-20%',
            left: '-20%',
            filter: 'blur(60px)',
            opacity: 0.8,
            animation: 'blob1 20s ease-in-out infinite, shimmer1 8s ease-in-out infinite',
          }}
        />

        {/* Blob 2 - Electric Blue/Periwinkle */}
        <div
          className="absolute w-[550px] h-[550px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 60% 40%, #C8E0FF 0%, #A8C8F8 30%, #78A8E8 70%, #5088D8 100%)',
            top: '10%',
            right: '-15%',
            filter: 'blur(65px)',
            opacity: 0.75,
            animation: 'blob2 25s ease-in-out infinite, pulse 6s ease-in-out infinite',
          }}
        />

        {/* Blob 3 - Deep Lavender/Purple with glow */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #F0D8FF 0%, #D8B8F0 25%, #C098D8 60%, #A078C0 100%)',
            bottom: '-15%',
            left: '20%',
            filter: 'blur(70px)',
            opacity: 0.8,
            animation: 'blob3 18s ease-in-out infinite, glow 5s ease-in-out infinite',
          }}
        />

        {/* Blob 4 - Warm Golden/Peach */}
        <div
          className="absolute w-[480px] h-[480px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 70% 30%, #FFF0E0 0%, #FFE0C8 20%, #F8D8C8 50%, #E8B898 100%)',
            top: '40%',
            left: '-5%',
            filter: 'blur(55px)',
            opacity: 0.72,
            animation: 'blob4 22s ease-in-out infinite, drift 7s ease-in-out infinite',
          }}
        />

        {/* Blob 5 - Vibrant Aqua/Teal with sparkle */}
        <div
          className="absolute w-[460px] h-[460px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 60%, #C8F0F0 0%, #A0D8D8 30%, #70C0C0 65%, #40A8A8 100%)',
            bottom: '10%',
            right: '10%',
            filter: 'blur(62px)',
            opacity: 0.78,
            animation: 'blob5 19s ease-in-out infinite, sparkle 4s ease-in-out infinite',
          }}
        />

        {/* Blob 6 - Sunset Orange/Coral (NEW) */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #FFE0B8 0%, #FFCA90 30%, #FF9870 70%, #FF7050 100%)',
            top: '5%',
            left: '35%',
            filter: 'blur(58px)',
            opacity: 0.7,
            animation: 'blob6 24s ease-in-out infinite, wave 9s ease-in-out infinite',
          }}
        />

        {/* Medium Texture Blobs - Enhanced with faster, more complex movements */}
        {/* Texture Blob 1 - Hot Pink with rotation */}
        <div
          className="absolute w-[320px] h-[320px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 25% 25%, #FFF0F5 0%, #FFD0E0 30%, #FFA8C0 80%, #FF80A0 100%)',
            top: '28%',
            right: '30%',
            filter: 'blur(45px)',
            opacity: 0.55,
            animation: 'texture1 15s ease-in-out infinite, spin 20s linear infinite',
          }}
        />

        {/* Texture Blob 2 - Cyan Blue with bounce */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 70% 70%, #E0F8FF 0%, #B8E0F8 25%, #88C8E8 70%, #58A8D8 100%)',
            bottom: '32%',
            left: '38%',
            filter: 'blur(48px)',
            opacity: 0.52,
            animation: 'texture2 13s ease-in-out infinite, bounce 5s ease-in-out infinite',
          }}
        />

        {/* Texture Blob 3 - Violet with pulse */}
        <div
          className="absolute w-[280px] h-[280px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 50% 80%, #F8E8FF 0%, #E8D0F8 30%, #D0B0E8 75%, #B890D8 100%)',
            top: '8%',
            left: '48%',
            filter: 'blur(50px)',
            opacity: 0.5,
            animation: 'texture3 12s ease-in-out infinite, pulse 4s ease-in-out infinite',
          }}
        />

        {/* Texture Blob 4 - Mint Green (NEW) */}
        <div
          className="absolute w-[260px] h-[260px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 60% 40%, #E0FFF0 0%, #B8F0D8 35%, #90E0C0 80%, #68D0A8 100%)',
            bottom: '20%',
            left: '15%',
            filter: 'blur(42px)',
            opacity: 0.48,
            animation: 'texture4 14s ease-in-out infinite, sway 6s ease-in-out infinite',
          }}
        />

        {/* Small Accent Blobs - Super dynamic with complex animations */}
        {/* Accent Blob 1 - Electric Pink */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 70%, #FFF5F8 0%, #FFE0D0 20%, #FFD0B8 60%, #FFB090 100%)',
            top: '58%',
            right: '48%',
            filter: 'blur(35px)',
            opacity: 0.42,
            animation: 'accent1 10s ease-in-out infinite, twirl 8s ease-in-out infinite',
          }}
        />

        {/* Accent Blob 2 - Bright Cyan */}
        <div
          className="absolute w-[180px] h-[180px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 80% 20%, #F0FFFF 0%, #C0E8E8 30%, #A0D8D8 70%, #70C8C8 100%)',
            bottom: '38%',
            right: '22%',
            filter: 'blur(32px)',
            opacity: 0.38,
            animation: 'accent2 8s ease-in-out infinite, float 5s ease-in-out infinite',
          }}
        />

        {/* Accent Blob 3 - Magenta */}
        <div
          className="absolute w-[160px] h-[160px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 45% 55%, #FFF0FF 0%, #F8E0F0 25%, #E8C0D8 65%, #D8A0C0 100%)',
            top: '38%',
            left: '18%',
            filter: 'blur(30px)',
            opacity: 0.35,
            animation: 'accent3 9s ease-in-out infinite, wobble 6s ease-in-out infinite',
          }}
        />

        {/* Accent Blob 4 - Lime (NEW) */}
        <div
          className="absolute w-[140px] h-[140px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 60% 60%, #F8FFE0 0%, #E0F8C0 35%, #C8E8A0 75%, #A8D880 100%)',
            top: '65%',
            left: '55%',
            filter: 'blur(28px)',
            opacity: 0.32,
            animation: 'accent4 7s ease-in-out infinite, zigzag 5s ease-in-out infinite',
          }}
        />

        {/* Accent Blob 5 - Rose Gold (NEW) */}
        <div
          className="absolute w-[120px] h-[120px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #FFF8F0 0%, #FFE8D8 30%, #F8D0B8 70%, #E8B898 100%)',
            bottom: '52%',
            right: '40%',
            filter: 'blur(25px)',
            opacity: 0.3,
            animation: 'accent5 6s ease-in-out infinite, dance 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Enhanced Animation keyframes */}
      <style jsx>{`
        /* Main blob animations with more dynamic movement */
        @keyframes blob1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(50px, -60px) scale(1.15);
          }
          50% {
            transform: translate(-30px, 40px) scale(0.85);
          }
          75% {
            transform: translate(40px, 30px) scale(1.05);
          }
        }

        @keyframes blob2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-60px, 50px) scale(0.9);
          }
          50% {
            transform: translate(45px, -45px) scale(1.2);
          }
          75% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }

        @keyframes blob3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(70px, 30px) scale(1.25);
          }
          50% {
            transform: translate(-40px, -50px) scale(0.8);
          }
          75% {
            transform: translate(20px, 40px) scale(1.1);
          }
        }

        @keyframes blob4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-35px, -45px) scale(0.75);
          }
          50% {
            transform: translate(55px, 35px) scale(1.15);
          }
          75% {
            transform: translate(-25px, -20px) scale(0.9);
          }
        }

        @keyframes blob5 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(50px, -35px) scale(1.2);
          }
          50% {
            transform: translate(-60px, 45px) scale(0.85);
          }
          75% {
            transform: translate(30px, -25px) scale(1.05);
          }
        }

        @keyframes blob6 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-45px, 55px) scale(1.1);
          }
          50% {
            transform: translate(50px, -40px) scale(0.9);
          }
          75% {
            transform: translate(-30px, 30px) scale(1.15);
          }
        }

        /* Texture blob animations with rotation */
        @keyframes texture1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-50px, 40px) scale(1.3) rotate(90deg);
          }
          50% {
            transform: translate(45px, -50px) scale(0.7) rotate(180deg);
          }
          75% {
            transform: translate(-30px, 30px) scale(1.1) rotate(270deg);
          }
        }

        @keyframes texture2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(55px, -45px) scale(0.75) rotate(-90deg);
          }
          50% {
            transform: translate(-50px, 55px) scale(1.25) rotate(-180deg);
          }
          75% {
            transform: translate(35px, -35px) scale(0.9) rotate(-270deg);
          }
        }

        @keyframes texture3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-60px, -40px) scale(1.2) rotate(120deg);
          }
          50% {
            transform: translate(50px, 45px) scale(0.8) rotate(240deg);
          }
          75% {
            transform: translate(-35px, 35px) scale(1.05) rotate(360deg);
          }
        }

        @keyframes texture4 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(45px, 50px) scale(1.15) rotate(-120deg);
          }
          50% {
            transform: translate(-55px, -45px) scale(0.85) rotate(-240deg);
          }
          75% {
            transform: translate(40px, -30px) scale(1.0) rotate(-360deg);
          }
        }

        /* Accent blob animations with extreme movement */
        @keyframes accent1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(70px, -50px) scale(1.4) rotate(72deg);
          }
          40% {
            transform: translate(-40px, 60px) scale(0.6) rotate(144deg);
          }
          60% {
            transform: translate(50px, 40px) scale(1.2) rotate(216deg);
          }
          80% {
            transform: translate(-60px, -30px) scale(0.8) rotate(288deg);
          }
        }

        @keyframes accent2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(-65px, 55px) scale(0.7) rotate(-72deg);
          }
          40% {
            transform: translate(60px, -60px) scale(1.3) rotate(-144deg);
          }
          60% {
            transform: translate(-45px, -40px) scale(0.85) rotate(-216deg);
          }
          80% {
            transform: translate(50px, 45px) scale(1.15) rotate(-288deg);
          }
        }

        @keyframes accent3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(55px, 65px) scale(1.35) rotate(108deg);
          }
          40% {
            transform: translate(-70px, -50px) scale(0.65) rotate(216deg);
          }
          60% {
            transform: translate(45px, -55px) scale(1.1) rotate(324deg);
          }
          80% {
            transform: translate(-35px, 40px) scale(0.9) rotate(432deg);
          }
        }

        @keyframes accent4 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(-60px, -55px) scale(1.25) rotate(-108deg);
          }
          40% {
            transform: translate(65px, 50px) scale(0.75) rotate(-216deg);
          }
          60% {
            transform: translate(-50px, 60px) scale(1.15) rotate(-324deg);
          }
          80% {
            transform: translate(55px, -45px) scale(0.85) rotate(-432deg);
          }
        }

        @keyframes accent5 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(50px, 55px) scale(1.3) rotate(90deg);
          }
          40% {
            transform: translate(-60px, -50px) scale(0.7) rotate(180deg);
          }
          60% {
            transform: translate(55px, -55px) scale(1.2) rotate(270deg);
          }
          80% {
            transform: translate(-45px, 50px) scale(0.8) rotate(360deg);
          }
        }

        /* Special effect animations */
        @keyframes shimmer1 {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.75;
            filter: blur(65px);
          }
          50% {
            opacity: 0.9;
            filter: blur(50px);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.8;
            filter: blur(70px);
          }
          50% {
            opacity: 0.95;
            filter: blur(55px);
          }
        }

        @keyframes drift {
          0%, 100% {
            opacity: 0.72;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0.78;
            filter: blur(62px);
          }
          25% {
            opacity: 0.9;
            filter: blur(50px);
          }
          75% {
            opacity: 0.65;
            filter: blur(70px);
          }
        }

        @keyframes wave {
          0%, 100% {
            opacity: 0.7;
          }
          33% {
            opacity: 0.85;
          }
          66% {
            opacity: 0.6;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(40px);
          }
        }

        @keyframes twirl {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-25px) translateX(25px);
          }
          66% {
            transform: translateY(25px) translateX(-25px);
          }
        }

        @keyframes wobble {
          0%, 100% {
            transform: skewX(0deg);
          }
          25% {
            transform: skewX(10deg);
          }
          75% {
            transform: skewX(-10deg);
          }
        }

        @keyframes zigzag {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -30px);
          }
          50% {
            transform: translate(-30px, -30px);
          }
          75% {
            transform: translate(30px, 30px);
          }
        }

        @keyframes dance {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(15px, -20px) scale(1.1);
          }
          40% {
            transform: translate(-20px, 15px) scale(0.9);
          }
          60% {
            transform: translate(20px, 20px) scale(1.15);
          }
          80% {
            transform: translate(-15px, -15px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
