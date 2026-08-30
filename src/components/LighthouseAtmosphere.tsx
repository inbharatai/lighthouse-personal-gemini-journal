import React, { useEffect, useRef } from 'react';

interface LighthouseAtmosphereProps {
  intensity?: 'subtle' | 'vivid';
  showOcean?: boolean;
}

export const LighthouseAtmosphere: React.FC<LighthouseAtmosphereProps> = ({
  intensity = 'subtle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // ==========================================
    // STARFIELD SIMULATION
    // ==========================================
    interface Star {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      twinkleSpeed: number;
      phase: number;
    }

    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const starCount = Math.floor((width * height) / 12000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.65),
          size: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    initStars();

    // ==========================================
    // MIST & SEA SPRAY PARTICLES
    // ==========================================
    interface MistParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      maxAlpha: number;
      life: number;
      maxLife: number;
    }

    const mistParticles: MistParticle[] = [];
    const maxMist = 45;

    for (let i = 0; i < maxMist; i++) {
      mistParticles.push({
        x: Math.random() * width,
        y: height * 0.6 + Math.random() * (height * 0.4),
        vx: Math.random() * 0.35 + 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        radius: Math.random() * 80 + 40,
        alpha: 0,
        maxAlpha: Math.random() * 0.08 + 0.02,
        life: Math.random() * 300,
        maxLife: Math.random() * 400 + 200,
      });
    }

    // ==========================================
    // MAIN SIMULATION LOOP
    // ==========================================
    let time = 0;

    const render = () => {
      time += 0.015;

      // 1. Sky Gradient (Deep cinematic midnight navy to abyss black)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#030407');
      skyGrad.addColorStop(0.4, '#070A10');
      skyGrad.addColorStop(0.65, '#0A0F1A');
      skyGrad.addColorStop(1, '#05070B');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Distant Celestial & Twilight Atmosphere
      const moonX = width * 0.75;
      const moonY = height * 0.22;
      const moonHaze = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 320);
      moonHaze.addColorStop(0, 'rgba(217, 230, 255, 0.08)');
      moonHaze.addColorStop(0.3, 'rgba(245, 158, 11, 0.03)');
      moonHaze.addColorStop(1, 'transparent');
      ctx.fillStyle = moonHaze;
      ctx.fillRect(0, 0, width, height * 0.7);

      // 3. Twinkling Starfield
      for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed * 60 + s.phase);
        const alpha = Math.max(0.05, s.baseAlpha + twinkle * 0.25);
        ctx.fillStyle = `rgba(240, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lighthouse Geometry Constants
      const lhX = Math.max(70, width * 0.12);
      const lhBaseY = height * 0.68;
      const lhHeight = Math.min(160, height * 0.24);
      const lhLanternY = lhBaseY - lhHeight;

      // 4. Lighthouse Sweeping Light Beam (Realistic 3D Orbital Projection)
      // Angle sweeps across the ocean: from -20 deg to +75 deg
      const sweepPeriod = 12; // 12 seconds per full sweep cycle
      const sweepAngle = Math.sin((time * Math.PI * 2) / sweepPeriod);
      // Beam direction angle (radians)
      const beamAngle = -0.25 + sweepAngle * 0.78; 
      // Depth foreshortening & intensity based on beam facing the viewer
      const beamFacing = Math.cos((time * Math.PI * 2) / sweepPeriod);
      const beamAlpha = 0.35 + Math.max(0, sweepAngle) * 0.55;

      ctx.save();
      ctx.translate(lhX, lhLanternY);
      ctx.rotate(beamAngle);

      // Primary Volumetric Light Cone
      const beamLength = Math.max(width, height) * 1.5;
      const beamSpread = 380 + (1 - sweepAngle) * 80;

      const beamGrad = ctx.createLinearGradient(0, 0, beamLength, 0);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      beamGrad.addColorStop(0.05, 'rgba(254, 243, 199, 0.75)');
      beamGrad.addColorStop(0.2, `rgba(251, 191, 36, ${0.45 * beamAlpha})`);
      beamGrad.addColorStop(0.55, `rgba(245, 158, 11, ${0.18 * beamAlpha})`);
      beamGrad.addColorStop(0.85, `rgba(217, 119, 6, ${0.05 * beamAlpha})`);
      beamGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(beamLength, -beamSpread * 0.45);
      ctx.lineTo(beamLength, beamSpread * 0.55);
      ctx.closePath();
      ctx.fill();

      // Sharp Intense Central Laser Core
      const coreGrad = ctx.createLinearGradient(0, 0, beamLength * 0.8, 0);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.8)');
      coreGrad.addColorStop(0.5, `rgba(251, 191, 36, ${0.3 * beamAlpha})`);
      coreGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(beamLength * 0.8, -18);
      ctx.lineTo(beamLength * 0.8, 22);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 5. Multi-Harmonic Ocean Wave Simulation (Fluid Mechanics with Specular Caustics)
      const oceanHorizon = height * 0.62;

      interface WaveLayer {
        baseY: number;
        amplitude: number;
        speed: number;
        frequency: number;
        colorGrad: [string, string, string];
        specularBoost: number;
        crestFoam: boolean;
      }

      const waveLayers: WaveLayer[] = [
        {
          baseY: oceanHorizon,
          amplitude: 6,
          speed: 0.8,
          frequency: 0.006,
          colorGrad: ['#090D15', '#06080E', '#040508'],
          specularBoost: 0.25,
          crestFoam: false,
        },
        {
          baseY: oceanHorizon + height * 0.08,
          amplitude: 10,
          speed: 1.1,
          frequency: 0.005,
          colorGrad: ['#0B101C', '#070B14', '#05070D'],
          specularBoost: 0.45,
          crestFoam: true,
        },
        {
          baseY: oceanHorizon + height * 0.17,
          amplitude: 15,
          speed: 1.4,
          frequency: 0.004,
          colorGrad: ['#0E1424', '#080D1A', '#04060C'],
          specularBoost: 0.7,
          crestFoam: true,
        },
        {
          baseY: oceanHorizon + height * 0.26,
          amplitude: 22,
          speed: 1.7,
          frequency: 0.0035,
          colorGrad: ['#121A2E', '#0A0F20', '#030509'],
          specularBoost: 1.0,
          crestFoam: true,
        },
      ];

      // Render each progressive wave layer from horizon to foreground
      waveLayers.forEach((layer, layerIdx) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const step = 8;
        const wavePoints: { x: number; y: number; slope: number }[] = [];

        for (let x = 0; x <= width + step; x += step) {
          // Superposition of 3 traveling harmonic sine/gerstner waves
          const wave1 = Math.sin(x * layer.frequency + time * layer.speed) * layer.amplitude;
          const wave2 = Math.sin(x * (layer.frequency * 2.1) - time * (layer.speed * 0.7) + layerIdx) * (layer.amplitude * 0.35);
          const wave3 = Math.cos(x * (layer.frequency * 0.5) + time * (layer.speed * 1.3)) * (layer.amplitude * 0.2);

          const y = layer.baseY + wave1 + wave2 + wave3;
          const slope = Math.cos(x * layer.frequency + time * layer.speed) * layer.amplitude * layer.frequency;

          wavePoints.push({ x, y, slope });

          if (x === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Base depth water gradient
        const waveGrad = ctx.createLinearGradient(0, layer.baseY - layer.amplitude, 0, height);
        waveGrad.addColorStop(0, layer.colorGrad[0]);
        waveGrad.addColorStop(0.3, layer.colorGrad[1]);
        waveGrad.addColorStop(1, layer.colorGrad[2]);
        ctx.fillStyle = waveGrad;
        ctx.fill();

        // Specular highlight where sweeping light beam intersects the wave crests
        const beamXProj = lhX + Math.cos(beamAngle) * (layer.baseY - lhLanternY) * 2.2;
        const beamInfluenceRadius = 320 * (1 + layerIdx * 0.4);

        for (let i = 0; i < wavePoints.length - 1; i++) {
          const pt = wavePoints[i];
          const distToBeam = Math.abs(pt.x - beamXProj);

          if (distToBeam < beamInfluenceRadius) {
            const proximity = 1 - distToBeam / beamInfluenceRadius;
            const specular = Math.pow(proximity, 2) * layer.specularBoost * (0.4 + sweepAngle * 0.6);

            if (specular > 0.04) {
              ctx.strokeStyle = `rgba(251, 191, 36, ${specular * 0.65})`;
              ctx.lineWidth = 1.8 + layerIdx * 0.8;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(wavePoints[i + 1].x, wavePoints[i + 1].y);
              ctx.stroke();
            }
          }

          // Sea foam along agitated wave crests
          if (layer.crestFoam && pt.slope > 0.04 && Math.sin(pt.x * 0.05 + time * 3) > 0.4) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + (layerIdx * 0.08)})`;
            ctx.fillRect(pt.x, pt.y - 1, step * 0.9, 1.5);
          }
        }
      });

      // 6. Coastal Rocky Headland (Left Shoreline Outcrop)
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, lhBaseY - 15);
      ctx.quadraticCurveTo(lhX * 0.8, lhBaseY - 10, lhX + 35, lhBaseY + 25);
      ctx.lineTo(lhX + 90, lhBaseY + 80);
      ctx.quadraticCurveTo(lhX + 160, lhBaseY + 140, lhX + 220, height);
      ctx.closePath();

      const cliffGrad = ctx.createLinearGradient(0, lhBaseY - 15, lhX + 200, height);
      cliffGrad.addColorStop(0, '#0E1117');
      cliffGrad.addColorStop(0.4, '#080A0E');
      cliffGrad.addColorStop(1, '#020305');
      ctx.fillStyle = cliffGrad;
      ctx.fill();

      // Cliff edge texture and surf crash foam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shoreline Crash Foam
      const surfTime = time * 2.5;
      const foamY = lhBaseY + 80 + Math.sin(surfTime) * 6;
      const foamGrad = ctx.createRadialGradient(lhX + 90, foamY, 5, lhX + 90, foamY, 60);
      foamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      foamGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.15)');
      foamGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = foamGrad;
      ctx.beginPath();
      ctx.arc(lhX + 90, foamY, 55, 0, Math.PI * 2);
      ctx.fill();

      // 7. Architectural Lighthouse Tower on the Cliff
      const towerBaseW = 28;
      const towerTopW = 18;
      const towerH = lhHeight;

      // Tower Shadow & Base
      ctx.fillStyle = '#06070A';
      ctx.fillRect(lhX - towerBaseW / 2 - 4, lhBaseY - 8, towerBaseW + 8, 12);

      // Tapered Tower Body
      ctx.beginPath();
      ctx.moveTo(lhX - towerBaseW / 2, lhBaseY);
      ctx.lineTo(lhX - towerTopW / 2, lhLanternY + 16);
      ctx.lineTo(lhX + towerTopW / 2, lhLanternY + 16);
      ctx.lineTo(lhX + towerBaseW / 2, lhBaseY);
      ctx.closePath();

      const towerGrad = ctx.createLinearGradient(lhX - towerBaseW / 2, 0, lhX + towerBaseW / 2, 0);
      towerGrad.addColorStop(0, '#151922');
      towerGrad.addColorStop(0.35, '#282E3D');
      towerGrad.addColorStop(0.7, '#12151D');
      towerGrad.addColorStop(1, '#080A0E');
      ctx.fillStyle = towerGrad;
      ctx.fill();

      // Tower Windows
      ctx.fillStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.fillRect(lhX - 2, lhLanternY + 45, 4, 7);
      ctx.fillRect(lhX - 2, lhLanternY + 80, 4, 7);

      // Gallery Walkway Railing
      ctx.fillStyle = '#0A0C11';
      ctx.fillRect(lhX - 16, lhLanternY + 12, 32, 4);

      // Lantern Glass Room
      ctx.fillStyle = 'rgba(254, 243, 199, 0.25)';
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1.5;
      ctx.fillRect(lhX - 11, lhLanternY - 2, 22, 14);
      ctx.strokeRect(lhX - 11, lhLanternY - 2, 22, 14);

      // Lantern Dome Cap
      ctx.beginPath();
      ctx.arc(lhX, lhLanternY - 2, 12, Math.PI, 0);
      ctx.fillStyle = '#0F1218';
      ctx.fill();

      // Beacon Spire
      ctx.strokeStyle = '#0F1218';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lhX, lhLanternY - 14);
      ctx.lineTo(lhX, lhLanternY - 22);
      ctx.stroke();

      // 8. Intense Pulsating Beacon Flare (Fresnel Light Source)
      const beaconPulse = 0.85 + Math.sin(time * 6) * 0.15 + (sweepAngle > 0.4 ? 0.35 : 0);
      const beaconGrad = ctx.createRadialGradient(lhX, lhLanternY + 5, 2, lhX, lhLanternY + 5, 40 * beaconPulse);
      beaconGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      beaconGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)');
      beaconGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
      beaconGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = beaconGrad;
      ctx.beginPath();
      ctx.arc(lhX, lhLanternY + 5, 40 * beaconPulse, 0, Math.PI * 2);
      ctx.fill();

      // 9. Floating Sea Mist / Dynamic Fog Particles
      for (const m of mistParticles) {
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;

        if (m.x > width + 100) m.x = -100;
        if (m.life > m.maxLife) {
          m.life = 0;
          m.x = -80;
          m.y = height * 0.65 + Math.random() * (height * 0.35);
        }

        // Fade in and out
        const progress = m.life / m.maxLife;
        m.alpha = Math.sin(progress * Math.PI) * m.maxAlpha;

        const mistGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
        mistGrad.addColorStop(0, `rgba(200, 220, 255, ${m.alpha})`);
        mistGrad.addColorStop(0.6, `rgba(245, 158, 11, ${m.alpha * 0.2})`);
        mistGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
};
