import { useEffect, useRef } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function Visualizer() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const { currentTrack, isPlaying, visualizerRef } = usePlayer();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let audioContext = audioContextRef.current;
    let analyser = analyserRef.current;

    // Initialize Web Audio API
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;

    // Connect audio element to analyser when available
    let source = null;
    const connectAudio = () => {
      if (visualizerRef.current && audioContext.state !== 'closed') {
        try {
          // Resume audio context if suspended
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          source = audioContext.createMediaElementSource(visualizerRef.current);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (error) {
          console.warn('Could not connect audio source:', error);
        }
      }
    };

    if (visualizerRef.current && isPlaying) {
      connectAudio();
    }

    const draw = () => {
      if (!analyser || !isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      const barCount = 60; // Show only first 60 bars for cleaner look
      const spacing = canvas.width / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * canvas.height * 0.8;

        const x = i * spacing;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1DB954');
        gradient.addColorStop(1, '#1ed760');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying && currentTrack && visualizerRef.current) {
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    };
  }, [currentTrack, isPlaying, visualizerRef]);

  // Set canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

