'use client'
import React, { useEffect, useRef } from 'react';

const NoddingOrange = ({ width = 120, height = 120 }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 250, y: 250 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let animationId;
    
    // Scale factor for smaller size
    const scale = width / 500;
    
    // Personality state
    let moodState = 'normal'; // normal, love, wink, suspicious, sleepy, surprised, cool, concerned
    let moodTimer = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * (500 / rect.width),
        y: (e.clientY - rect.top) * (500 / rect.height)
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    const animate = () => {
      ctx.clearRect(0, 0, 500, 500);
      
      // Update mood logic
      if (moodTimer > 0) {
        moodTimer--;
      } else {
        // Randomly pick a new mood every few seconds
        const rand = Math.random();
        if (rand < 0.05) {
          moodState = 'love';
          moodTimer = 120;
        } else if (rand < 0.10) {
          moodState = 'wink';
          moodTimer = 80;
        } else if (rand < 0.15) {
          moodState = 'suspicious';
          moodTimer = 140;
        } else if (rand < 0.20) {
          moodState = 'sleepy';
          moodTimer = 180;
        } else if (rand < 0.25) {
          moodState = 'surprised';
          moodTimer = 60;
        } else if (rand < 0.30) {
          moodState = 'cool';
          moodTimer = 200;
        } else if (rand < 0.35) {
          moodState = 'concerned';
          moodTimer = 120;
        } else {
          moodState = 'normal';
          moodTimer = Math.random() * 200 + 100; 
        }
      }

      // Slow time factor for gentle animations
      // Sleepy mood slows down time
      const timeScale = moodState === 'sleepy' ? 0.5 : 1;
      const t = (frame * timeScale % 300) / 300;
      
      // Gentle floating motion with Squash & Stretch
      const bounce = Math.sin(t * Math.PI * 2);
      // Sleepy mood bounces less
      const bounceHeight = moodState === 'sleepy' ? 3 : 8;
      const floatY = bounce * bounceHeight;
      
      // Calculate squash (widen when hitting bottom)
      const squashFactor = 1 + Math.max(0, bounce) * 0.03;
      const stretchFactor = 1 / squashFactor;

      // Orange body position
      const bodyX = 250;
      const bodyY = 250 + floatY;
      
      // Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.translate(bodyX, 380);
      ctx.scale(squashFactor, 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 70 - floatY * 0.5, 70 - floatY * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Draw orange body
      ctx.save();
      ctx.translate(bodyX, bodyY);
      ctx.scale(squashFactor, stretchFactor); 
      
      const gradient = ctx.createRadialGradient(-20, -30, 20, 0, 0, 90);
      gradient.addColorStop(0, '#FFB84D');
      gradient.addColorStop(1, '#FF9E1F');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();

      // --- HEADSET BASE ---
      ctx.save();
      ctx.translate(bodyX, bodyY);
      ctx.scale(squashFactor * 0.98, stretchFactor * 0.98); 
      
      ctx.beginPath();
      ctx.strokeStyle = '#2C2C2C';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.moveTo(-82, -10); 
      ctx.bezierCurveTo(-82, -120, 82, -120, 82, -10);
      ctx.stroke();

      ctx.fillStyle = '#4A4A4A';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 5;
      
      // Cups
      ctx.beginPath(); ctx.ellipse(-84, -5, 18, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(84, -5, 18, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2C2C2C';
      ctx.beginPath(); ctx.ellipse(-84, -5, 10, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(84, -5, 10, 18, 0, 0, Math.PI * 2); ctx.fill();
      
      ctx.restore();
      
      // --- LEAVES ---
      // Sleepy leaves barely move
      const leafEnergy = moodState === 'sleepy' ? 0.3 : 1;
      const leafFlutter1 = Math.sin(t * Math.PI * 2 * 1.3) * 0.1 * leafEnergy; 
      const leafFlutter2 = Math.sin(t * Math.PI * 2 * 1.1) * 0.12 * leafEnergy;
      const happyWiggle = (moodState === 'love' || moodState === 'cool') ? Math.sin(frame * 0.5) * 0.2 : 0;
      const shockedLift = moodState === 'surprised' ? -15 : 0; // Leaves shoot up when surprised
      
      const drawLeaf = (width, height) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-width, -height / 2, 0, -height);
        ctx.quadraticCurveTo(width, -height / 2, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(0, -height * 0.7);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();
      };

      // Back leaf
      ctx.save();
      ctx.translate(bodyX + 2, bodyY - 82 + floatY * 0.1 + shockedLift); 
      ctx.rotate(0.6 + leafFlutter2 + happyWiggle); 
      ctx.fillStyle = '#4CA85A';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawLeaf(22, 55);
      ctx.restore();
      
      // Front leaf
      ctx.save();
      ctx.translate(bodyX - 2, bodyY - 84 + floatY * 0.1 + shockedLift); 
      ctx.rotate(-0.8 + leafFlutter1 - happyWiggle); 
      ctx.fillStyle = '#7FD88E';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawLeaf(18, 45);
      ctx.restore();
      
      // Stem
      ctx.save();
      ctx.translate(bodyX, bodyY - 85 + floatY * 0.1 + shockedLift);
      ctx.fillStyle = '#5A4A3A';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.rect(-4, -8, 8, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // --- FACIAL EXPRESSIONS & MOUSE TRACKING ---
      ctx.save();
      ctx.translate(bodyX, bodyY);

      // Calculate look direction
      const maxEyeMove = 8;
      const dx = mouseRef.current.x - bodyX;
      const dy = mouseRef.current.y - bodyY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const moveRatio = Math.min(dist, 100) / 100;
      
      let lookX = (dx / (dist || 1)) * maxEyeMove * moveRatio;
      let lookY = (dy / (dist || 1)) * maxEyeMove * moveRatio;

      // Adjust tracking based on mood
      if (moodState === 'suspicious') {
          lookX = lookX * 1.2;
          lookY = lookY * 0.5;
      } else if (moodState === 'sleepy' || moodState === 'cool') {
          // Too tired or too cool to look around
          lookX = lookX * 0.1; 
          lookY = lookY * 0.1;
      } else if (moodState === 'surprised') {
          // Jittery eyes
          lookX = lookX * 0.5 + (Math.random() - 0.5) * 2;
          lookY = lookY * 0.5 + (Math.random() - 0.5) * 2;
      }

      const blinkPhase = (frame % 200) / 200;
      const isBlinking = blinkPhase > 0.98;

      // -- EYES --
      ctx.fillStyle = '#1A1A1A';
      ctx.strokeStyle = '#1A1A1A';
      
      if (moodState === 'love') {
        // Heart Eyes
        const drawHeart = (x, y, scale) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#FF5252';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.bezierCurveTo(-5, 0, -10, -5, -10, -10);
            ctx.bezierCurveTo(-10, -15, -5, -20, 0, -15);
            ctx.bezierCurveTo(5, -20, 10, -15, 10, -10);
            ctx.bezierCurveTo(10, -5, 5, 0, 0, 5);
            ctx.fill();
            ctx.restore();
        };
        drawHeart(-28 + lookX * 0.5, -10 + lookY * 0.5, 1.2);
        drawHeart(28 + lookX * 0.5, -10 + lookY * 0.5, 1.2);

      } else if (moodState === 'cool') {
        // Sunglasses
        ctx.fillStyle = '#111111'; // Very dark
        ctx.save();
        ctx.translate(0 + lookX * 0.2, -12 + lookY * 0.2); // Glasses shift slightly
        
        // Lenses
        ctx.beginPath();
        // Left lens (semi-circleish)
        ctx.moveTo(-45, -5);
        ctx.quadraticCurveTo(-45, 10, -25, 10);
        ctx.quadraticCurveTo(-5, 10, -5, -5);
        ctx.lineTo(-45, -5);
        ctx.fill();
        
        // Right lens
        ctx.beginPath();
        ctx.moveTo(45, -5);
        ctx.quadraticCurveTo(45, 10, 25, 10);
        ctx.quadraticCurveTo(5, 10, 5, -5);
        ctx.lineTo(45, -5);
        ctx.fill();
        
        // Bridge
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.quadraticCurveTo(0, -10, 5, -5);
        ctx.stroke();
        
        // Shine on glasses
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(-40, -2);
        ctx.lineTo(-25, 6);
        ctx.lineTo(-38, 6);
        ctx.fill();
        
        ctx.restore();

      } else if (moodState === 'sleepy') {
        // Closed, droopy eyes (U shape lines)
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(-28, -6, 8, 0, Math.PI, false); // Downward curve
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(28, -6, 8, 0, Math.PI, false);
        ctx.stroke();
        
        // ZZZ bubbles
        if (frame % 60 < 30) {
            ctx.fillStyle = '#2C2C2C';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('z', 45, -30 - (frame % 30));
        }

      } else if (moodState === 'surprised') {
        // Wide eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-28, -10, 12, 0, Math.PI * 2);
        ctx.arc(28, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Tiny Pupils
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(-28 + lookX * 0.5, -10 + lookY * 0.5, 3, 0, Math.PI * 2);
        ctx.arc(28 + lookX * 0.5, -10 + lookY * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (moodState === 'concerned') {
        // Slanted eyebrows / sad eyes
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Eyes
        ctx.beginPath();
        ctx.arc(-28 + lookX, -6 + lookY, 6, 0, Math.PI * 2);
        ctx.arc(28 + lookX, -6 + lookY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-30 + lookX, -9 + lookY, 2, 0, Math.PI * 2);
        ctx.arc(26 + lookX, -9 + lookY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyebrows (slanted up in middle)
        ctx.strokeStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.moveTo(-38, -18); ctx.lineTo(-20, -24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(38, -18); ctx.lineTo(20, -24);
        ctx.stroke();

      } else if (isBlinking || moodState === 'wink') {
        // Wink or Blink logic
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        if (isBlinking || moodState === 'wink') {
            ctx.beginPath();
            ctx.arc(-28, -10, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(-28 + lookX, -10 + lookY, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        if (isBlinking) {
            ctx.beginPath();
            ctx.arc(28, -10, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
             ctx.beginPath();
             ctx.arc(28 + lookX, -10 + lookY, 6, 0, Math.PI * 2);
             ctx.fill();
        }

      } else if (moodState === 'suspicious') {
        // Squinty eyes
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-36, -14); ctx.lineTo(-20, -12); ctx.stroke();
        ctx.moveTo(20, -12); ctx.lineTo(36, -14); ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(-28 + lookX, -8 + lookY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(28 + lookX, -8 + lookY, 4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // NORMAL MODE
        ctx.beginPath();
        ctx.arc(-28 + lookX, -10 + lookY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(28 + lookX, -10 + lookY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-30 + lookX, -13 + lookY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(26 + lookX, -13 + lookY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // -- MOUTH --
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      if (moodState === 'love') {
        ctx.arc(0, 10, 18, 0.2, Math.PI - 0.2);
      } else if (moodState === 'suspicious') {
        ctx.moveTo(-5, 20); ctx.lineTo(5, 20);
      } else if (moodState === 'wink' || moodState === 'cool') {
        ctx.arc(0, 15, 20, 0.1, Math.PI - 0.2); // Smirk
      } else if (moodState === 'sleepy') {
        ctx.arc(0, 20, 6, 0, Math.PI * 2); // Small 'o' yawn
      } else if (moodState === 'surprised') {
        ctx.ellipse(0, 25, 8, 12, 0, 0, Math.PI * 2); // Big 'O'
      } else if (moodState === 'concerned') {
        ctx.arc(0, 25, 12, Math.PI + 0.4, 2 * Math.PI - 0.4); // Frown
      } else {
        ctx.arc(0, 15, 15, 0.3, Math.PI - 0.3);
      }
      ctx.stroke();
      
      // -- CHEEKS --
      const cheekAlpha = (moodState === 'love' || moodState === 'surprised') ? 0.4 : 0.15;
      ctx.fillStyle = `rgba(255, 100, 80, ${cheekAlpha})`;
      
      if (moodState !== 'cool') { // Hide cheeks if sunglasses are too big
          ctx.beginPath(); ctx.arc(-45, 8, 12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(45, 8, 12, 0, Math.PI * 2); ctx.fill();
      }
      
      ctx.restore();

      // --- HEADSET MIC & STATUS ---
      ctx.save();
      ctx.translate(bodyX, bodyY);

      // Microphone Boom
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#2C2C2C';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(-82, 10); 
      ctx.bezierCurveTo(-65, 45, -45, 45, -30, 35);
      ctx.stroke();

      // Mic Head
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(-30, 35, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Online Status Indicator
      const pulseSpeed = (moodState === 'normal' || moodState === 'sleepy') ? 0.1 : 0.3;
      const pulse = Math.sin(frame * pulseSpeed) * 0.5 + 0.5;
      
      ctx.beginPath();
      ctx.arc(65, 65, 8 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(76, 175, 80, ${0.4 - pulse * 0.2})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(65, 65, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      
      frame++;
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={500}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

export default NoddingOrange;
