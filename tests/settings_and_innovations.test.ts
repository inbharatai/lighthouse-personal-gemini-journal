import { describe, it, expect } from 'vitest';
import { PRISM_MODES, PrismMode } from '../src/components/PrismModeSelector.js';
import { soundscapeEngine } from '../src/utils/audioSoundscape.js';

describe('Settings and Innovative Features Suite', () => {
  it('defines comprehensive reflection Prism frameworks', () => {
    const modes: PrismMode[] = ['socratic', 'stoic', 'strategist', 'compassion', 'first_principles'];

    modes.forEach((mode) => {
      expect(PRISM_MODES[mode]).toBeDefined();
      expect(PRISM_MODES[mode].label).toBeTruthy();
      expect(PRISM_MODES[mode].description).toBeTruthy();
      expect(PRISM_MODES[mode].promptPrefix).toContain('PRISM FRAMEWORK');
    });
  });

  it('soundscape engine initializes safely and handles volume / sound types', () => {
    expect(soundscapeEngine.getCurrentType()).toBe('none');
    expect(soundscapeEngine.getVolume()).toBe(0.4);

    soundscapeEngine.setVolume(0.75);
    expect(soundscapeEngine.getVolume()).toBe(0.75);

    soundscapeEngine.setVolume(1.5); // clamps to 1
    expect(soundscapeEngine.getVolume()).toBe(1);

    soundscapeEngine.setVolume(-0.5); // clamps to 0
    expect(soundscapeEngine.getVolume()).toBe(0);

    // Stop resets state cleanly
    soundscapeEngine.stop();
    expect(soundscapeEngine.getCurrentType()).toBe('none');
  });
});
