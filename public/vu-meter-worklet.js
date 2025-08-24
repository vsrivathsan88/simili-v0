const SMOOTHING_FACTOR = 0.6;
const BUFFER_SIZE = 4800;

class VolumeMeterWorklet extends AudioWorkletProcessor {
  buffer = new Float32Array(BUFFER_SIZE);
  bufferLength = 0;

  constructor() {
    super();
    this.previousVolume = 0;
  }

  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  calculateVolume(inputs) {
    const input = inputs[0];
    if (!input.length) return 0;

    const channel = input[0];
    const remainingSpace = BUFFER_SIZE - this.bufferLength;
    const samplesToProcess = Math.min(channel.length, remainingSpace);

    for (let i = 0; i < samplesToProcess; i++) {
      this.buffer[this.bufferLength + i] = channel[i];
    }
    this.bufferLength += samplesToProcess;

    if (this.bufferLength >= BUFFER_SIZE) {
      const rms = this.calculateRMS(this.buffer);
      const volume = 20 * Math.log10(rms + 0.0001);
      const normalizedVolume = Math.max(0, Math.min(1, (volume + 60) / 60));
      const smoothedVolume = 
        SMOOTHING_FACTOR * this.previousVolume + 
        (1 - SMOOTHING_FACTOR) * normalizedVolume;
      
      this.previousVolume = smoothedVolume;
      this.bufferLength = 0;
      
      return smoothedVolume;
    }

    return this.previousVolume;
  }

  process(inputs, outputs) {
    const volume = this.calculateVolume(inputs);

    this.port.postMessage({
      event: "volume",
      volume: volume,
    });

    return true;
  }
}

registerProcessor("vu-meter", VolumeMeterWorklet);