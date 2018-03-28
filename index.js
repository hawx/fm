const audioCtx = new AudioContext();

const destination = audioCtx.createGain();
destination.connect(audioCtx.destination);

function Envelope(gainNode, attack, decay, sustain, release) {
  return {
    on(time, volume) {
      gainNode.gain.cancelScheduledValues(time);
      gainNode.gain.value = volume;
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + attack);
      gainNode.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);
    },
    off(time) {
      gainNode.gain.cancelScheduledValues(0);
      gainNode.gain.setValueAtTime(gainNode.gain.value, time);
      gainNode.gain.linearRampToValueAtTime(0, time + release);
    }
  };
}

class Modulator {
  constructor(type, freq, gain) {
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
    this.osc.type = type;
    this.osc.frequency.value = freq;
    this.gain.gain.value = gain;
    this.osc.connect(this.gain);
  }

  env(attack, decay, sustain, release) {
    this.envelope = Envelope(this.gain, attack, decay, sustain, release);
  }

  modulate(other) {
    this.gain.connect(other.osc.frequency);
    return other;
  }

  on(freq, time) {
    this.envelope.on(time, freq);
  }

  off(time) {
    this.envelope.off(time);
  }
}

class Carrier {
  constructor(type, freq) {
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
    this.osc.type = type;
    this.osc.frequency.value = freq;
    this.osc.connect(this.gain);
    this.osc.start();
  }

  env(attack, decay, sustain, release) {
    this.envelope = Envelope(this.gain, attack, decay, sustain, release);
  }

  on(freq, time) {
    this.osc.frequency.value = freq;
    this.envelope.on(time, 1);
  }

  off(time) {
    this.envelope.off(time);
  }
}

class Synth {
  constructor(dest) {
    this.carrier = new Carrier('sine', 300);
    this.carrier.env(0.01, 0.7, 0.5, 0.1);

    this.modulator = new Modulator('sine', 100, 300);
    this.modulator.env(0.01, 0.5, 0.7, 0.4);

    this.otherModulator = new Modulator('sine', 100*Math.random(), 300 *Math.random());
    this.otherModulator.env(0.05, 0.3, 0.5, 0.1);

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

document.onkeydown = (e) => {
  const freq = freqForKey(e.key);
  if (freq) {
    e.preventDefault();
    synth.on(freq, audioCtx.currentTime);
  }
};

document.onkeyup = (e) => {
  e.preventDefault();
  synth.off(audioCtx.currentTime);
};

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
