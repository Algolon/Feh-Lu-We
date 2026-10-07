// First-person walker: calm grounded movement, wall sliding, stair ramps, gentle gravity.
import * as THREE from 'three';
import type { CollisionWorld } from './collision';
import type { PlayerPose } from '../core/state';
import { Gait, type StepEvent } from './gait';

export const PLAYER = {
  radius: 0.3,
  height: 1.75,
  eye: 1.65,
  stepUp: 0.42,
  walk: 3.2,
  run: 5.0,
  pitchLimit: 1.35,
};

export class Player {
  x = 0; y = 0; z = 0;
  yaw = 0; pitch = 0;
  private vy = 0;
  private eyeY = 0;
  private velX = 0; private velZ = 0;
  distance = 0; // accumulated walking distance (footsteps)
  onStep: ((e: StepEvent) => void) | null = null;
  private gait = new Gait();

  setPose(p: PlayerPose) {
    this.x = p.x; this.y = p.y; this.z = p.z; this.yaw = p.yaw; this.pitch = p.pitch;
    this.vy = 0; this.eyeY = p.y; this.velX = this.velZ = 0;
    this.gait.reset();
  }
  pose(): PlayerPose {
    return { x: this.x, y: this.y, z: this.z, yaw: this.yaw, pitch: this.pitch };
  }

  look(dYaw: number, dPitch: number) {
    this.yaw = (this.yaw + dYaw) % (Math.PI * 2);
    this.pitch = Math.max(-PLAYER.pitchLimit, Math.min(PLAYER.pitchLimit, this.pitch - dPitch));
  }

  update(dt: number, moveX: number, moveY: number, runAmt: number, col: CollisionWorld) {
    const speed = PLAYER.walk + (PLAYER.run - PLAYER.walk) * Math.min(1, Math.max(0, runAmt));
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw); // forward (plan)
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw); // right (plan)
    const tx = (fx * moveY + rx * moveX) * speed;
    const tz = (fz * moveY + rz * moveX) * speed;
    // light acceleration smoothing so motion feels grounded, not twitchy
    const a = Math.min(1, dt * 12);
    this.velX += (tx - this.velX) * a;
    this.velZ += (tz - this.velZ) * a;
    if (Math.abs(this.velX) < 1e-3 && Math.abs(this.velZ) < 1e-3) { this.velX = this.velZ = 0; }
    const ox = this.x, oz = this.z;
    if (this.velX || this.velZ) col.move(this, this.velX * dt, this.velZ * dt, PLAYER.radius, PLAYER.height, PLAYER.stepUp);
    // gravity towards the support surface
    const support = col.supportHeight(this.x, this.z, this.y, PLAYER.stepUp);
    if (support < this.y - 1e-3) {
      this.vy -= 18 * dt;
      this.y = Math.max(support, this.y + this.vy * dt);
      if (this.y === support) this.vy = 0;
    } else {
      this.y = support;
      this.vy = 0;
    }
    const moved = Math.hypot(this.x - ox, this.z - oz);
    this.distance += moved;
    const step = this.gait.update(dt, moved); // cadence from real speed (gait.ts), not a fixed short distance
    if (step) this.onStep?.(step);
    // smooth the eye over steps/ramps
    this.eyeY += (this.y - this.eyeY) * Math.min(1, dt * 14);
    if (Math.abs(this.eyeY - this.y) > 0.6) this.eyeY = this.y;
  }

  applyCamera(cam: THREE.PerspectiveCamera) {
    cam.position.set(this.x, this.eyeY + PLAYER.eye, -this.z);
    cam.rotation.set(this.pitch, -this.yaw, 0, 'YXZ');
  }
}
