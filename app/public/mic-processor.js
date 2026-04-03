/**
 * mic-processor.js  — AudioWorkletProcessor
 *
 * Collects mono Float32 samples from the audio thread and posts them to the
 * main thread in ~256-sample chunks (matching the old ScriptProcessor size).
 * Served as a static file from /public so it can be loaded via addModule().
 */
class MicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel?.length) {
      // Transfer the buffer to avoid a copy
      const copy = new Float32Array(channel);
      this.port.postMessage(copy, [copy.buffer]);
    }
    return true; // keep alive
  }
}

registerProcessor("mic-processor", MicProcessor);
