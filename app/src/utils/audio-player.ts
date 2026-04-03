import { Constants } from "../constants";

export class AudioPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;

  constructor() {
    this.ctx = new AudioContext({
      sampleRate: Constants.LIVE_CHAT_AI_SAMPLE_RATE,
    });
  }

  enqueue(samples: Float32Array<ArrayBuffer>) {
    const buffer = this.ctx.createBuffer(
      1,
      samples.length,
      Constants.LIVE_CHAT_AI_SAMPLE_RATE,
    );
    buffer.copyToChannel(samples, 0);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    const startAt = Math.max(this.ctx.currentTime, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
  }

  close() {
    this.ctx.close();
  }
}
