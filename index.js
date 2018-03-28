const audioCtx = new AudioContext();

const destination = audioCtx.createGain();
destination.connect(audioCtx.destination);

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
    gainNode.gain.setValueAtTime(gainNode.gain.value, time);
    gainNode.gain.linearRampToValueAtTime(0, time + this.release);
  }
}

class Modulator {
  constructor(type, freq, gain, envelope) {
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
    return other;
  }

  on(freq, time) {
    this.envelope.applyOn(this.gain, time, freq);
  }

  off(time) {
    this.envelope.applyOff(this.gain, time);
  }
}

class Carrier {
  constructor(type, freq, envelope) {
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

class Synth {
  constructor(dest) {
    const carrierEnvelope = new Envelope(0.01, 0.7, 0.4, 0);
    this.carrier = new Carrier('sine', 500, carrierEnvelope);

    const modulatorEnvelope = new Envelope(0.01, 0.5, 0.3, 0.1);
    this.modulator = new Modulator('sine', 100, 300, modulatorEnvelope);
    this.otherModulator = new Modulator('sine', 500, 300 * Math.random(), modulatorEnvelope);

    this.otherModulator.modulate(this.carrier);
    this.modulator.modulate(this.carrier);
    this.modulator.modulate(this.modulator);
    this.carrier.gain.gain.value = 0;
    this.carrier.gain.connect(dest);
  }

  on(freq, time) {
    this.carrier.on(freq, time);
    this.modulator.on(freq, time);
    this.otherModulator.on(freq, time);
  }

  off(time) {
    this.carrier.off(time);
    this.modulator.off(time);
    this.otherModulator.off(time);
  }
}

const synth = new Synth(destination);

function freqForKey(char) {
  switch (char) {
  case 'a':
    return 523.251130601197269;
  case 'w':
    return 554.365261953744192;
  case 's':
    return 587.329535834815120;
  case 'e':
    return 622.253967444161821;
  case 'd':
    return 659.255113825739859;
  case 'f':
    return 698.456462866007768;
  case 't':
    return 739.988845423268797;
  case 'g':
    return 783.990871963498588;
  case 'y':
    return 830.609395159890277;
  case 'h':
    return 880.000000000000000;
  case 'u':
    return 932.327523036179832;
  case 'j':
    return 987.766602512248223;
  default:
    return null;
  }
}

const app = new Vue({
  el: '#app',
  data: {
    attack: 50,
    sustain: 50,
    decay: 50,
    release: 50
  },
  watch: {
    attack(val) {
      synth.carrier.envelope.attack = val / 100;
    },
    sustain(val) {
      synth.carrier.envelope.sustain = val / 100;
    },
    decay(val) {
      synth.carrier.envelope.decay = val / 100;
    },
    release(val) {
      synth.carrier.envelope.release = val / 100;
    }
  }
});

let isDown = false;

document.onkeydown = (e) => {
  if (isDown) { return; }

  const freq = freqForKey(e.key);
  if (freq) {
    e.preventDefault();
    isDown = true;
    synth.on(freq, audioCtx.currentTime);
  }
};

document.onkeyup = (e) => {
  const freq = freqForKey(e.key);
  if (freq) {
    e.preventDefault();
    isDown = false;
    synth.off(audioCtx.currentTime);
  }
};
