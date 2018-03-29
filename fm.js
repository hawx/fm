class Envelope {
  constructor(attack, decay, sustain, release) {
    this.attack = attack;
    this.decay = decay;
    this.sustain = sustain;
    this.release = release;
  }

  applyOn(gainNode, time, volume) {
    gainNode.gain.cancelScheduledValues(time);
    gainNode.gain.value = volume;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + this.attack);
    gainNode.gain.linearRampToValueAtTime(volume * this.sustain, time + this.attack + this.decay);
  }

  applyOff(gainNode, time) {
    gainNode.gain.cancelScheduledValues(0);
    gainNode.gain.linearRampToValueAtTime(0, time + this.release);
  }
}

class Modulator {
  constructor(audioCtx, type, freq, gain, envelope) {
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
    this.osc.type = type;
    this.osc.frequency.value = freq;
    this.gain.gain.value = gain;
    this.envelope = envelope;
    this.osc.connect(this.gain);
    this.osc.start();
  }

  modulate(other) {
    this.gain.connect(other.osc.frequency);
  }

  on(freq, time) {
    this.envelope.applyOn(this.gain, time, freq);
  }

  off(time) {
    this.envelope.applyOff(this.gain, time);
  }
}

class Carrier {
  constructor(audioCtx, type, freq, envelope) {
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
    this.osc.type = type;
    this.osc.frequency.value = freq;
    this.envelope = envelope;
    this.osc.connect(this.gain);
    this.osc.start();
  }

  env(attack, decay, sustain, release) {
    this.envelope = Envelope(attack, decay, sustain, release);
  }

  on(freq, time) {
    this.osc.frequency.value = freq;
    this.envelope.applyOn(this.gain, time, 1);
  }

  off(time) {
    this.envelope.applyOff(this.gain, time);
  }
}

function algorithm1(audioCtx, dest) {
  const op1Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op1 = new Carrier(audioCtx, 'sine', 500, op1Envelope);

  const op2Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op2 = new Modulator(audioCtx, 'sine', 100, 300, op2Envelope);

  op2.modulate(op1);
  op1.gain.gain.value = 0;
  op1.gain.connect(dest);

  const op3Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op3 = new Carrier(audioCtx, 'sine', 700, op3Envelope);

  const op4Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op4 = new Modulator(audioCtx, 'sine', 2100, 300, op4Envelope);

  const op5Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op5 = new Modulator(audioCtx, 'sine', 2500, 300, op5Envelope);

  const op6Envelope = new Envelope(0.01, 0.7, 0.4, 0);
  const op6 = new Modulator(audioCtx, 'sine', 10000, 300, op6Envelope);

  op6.modulate(op6);
  op6.modulate(op5);
  op5.modulate(op4);
  op4.modulate(op3);
  op3.gain.gain.value = 0;
  op3.gain.connect(dest);

  return [op1, op2, op3, op4, op5, op6];
}

function basicAlgorithm(audioCtx, dest) {
  const carrierEnvelope = new Envelope(0.01, 0.7, 0.4, 0);
  const carrier = new Carrier(audioCtx, 'sine', 500, carrierEnvelope);

  const modulatorEnvelope = new Envelope(0.01, 0.5, 0.3, 0.1);
  const modulator = new Modulator(audioCtx, 'sine', 100, 300, modulatorEnvelope);
  const otherModulator = new Modulator(audioCtx, 'sine', 500, 300 * Math.random(), modulatorEnvelope);

  otherModulator.modulate(carrier);
  modulator.modulate(carrier);
  modulator.modulate(modulator);
  carrier.gain.gain.value = 0;
  carrier.gain.connect(dest);

  return [carrier, modulator, otherModulator];
}

class Synth {
  constructor(audioCtx, dest) {
    this.operators = algorithm1(audioCtx, dest);

    this.carrierEnvelope = this.operators[0].envelope;
    this.modulatorEnvelope = this.operators[1].envelope;
  }

  on(freq, time) {
    this.operators.forEach((operator) => {
      operator.on(freq, time);
    });
  }

  off(time) {
    this.operators.forEach((operator) => {
      operator.off(time);
    });
  }
}
