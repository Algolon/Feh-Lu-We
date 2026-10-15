// Small field-recording bank embedded in the game bundle (32 kbps mono MP3; no runtime fetch).
// Sources:
// - Grass: davidsonfreemedia, "Walking on grass (slowly)" (CC0 via Freesound / Pixabay)
// - Dirt: Soumages, "Walking on dirt" (Pixabay Content License)
// Each [offset, duration] selects one separately edited footfall in the concatenated sound bank.
// Use the decoded AudioBuffer with buffer-source offsets; maintain the existing gait cadence.
import { PART_A } from './fieldFootstepsDataA';
import { PART_B } from './fieldFootstepsDataB';

export const FIELD_FOOTSTEPS_MP3 = PART_A + PART_B;
export const FIELD_FOOTSTEP_CLIPS = {
  grass: [[0.068, 0.44], [0.576, 0.44]],
  dirt: [[1.084, 0.44], [1.592, 0.46]],
} as const;
