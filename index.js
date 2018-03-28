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
    this.carrierEnvelope = new Envelope(0.01, 0.7, 0.4, 0);
    this.carrier = new Carrier('sine', 500, this.carrierEnvelope);

    this.modulatorEnvelope = new Envelope(0.01, 0.5, 0.3, 0.1);
    this.modulator = new Modulator('sine', 100, 300, this.modulatorEnvelope);
    this.otherModulator = new Modulator('sine', 500, 300 * Math.random(), this.modulatorEnvelope);

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

Vue.component('button-counter', {
  data: function () {
    return {
      count: 0
    };
  },
  template: '<button v-on:click="count++">You clicked me {{ count }} times.</button>'
});

Vue.component('envelope-settings', {
  props: ['title', 'attack', 'sustain', 'decay', 'release'],
  template: `
    <fieldset>
      <h3>{{ title }}</h3>
      <div class="attack">
        <label>Attack</label>
        <input type="range" max="1" step="0.01" v-model.number="attack" />
        <output>{{ attack }}</output>
      </div>

      <div class="sustain">
        <label>Sustain</label>
        <input type="range" max="1" step="0.01" v-model.number="sustain" />
        <output>{{ sustain }}</output>
      </div>

      <div class="decay">
        <label>Decay</label>
        <input type="range" max="1" step="0.01" v-model.number="decay" />
        <output>{{ decay }}</output>
      </div>

      <div class="release">
        <label>Release</label>
        <input type="range" max="1" step="0.01" v-model.number="release" />
        <output>{{ release }}</output>
      </div>
    </fieldset>
  `,
  watch: {
    attack(val) {
      this.$emit('attack', val);
    },
    sustain(val) {
      this.$emit('sustain', val);
    },
    decay(val) {
      this.$emit('decay', val);
    },
    release(val) {
      this.$emit('release', val);
    }
  }
});

const app = new Vue({
  el: '#app',
  data: {
    carrier: {
      attack: 0.01,
      sustain: 0.7,
      decay: 0.4,
      release: 0
    },
    modulator: {
      attack: 0.01,
      sustain: 0.5,
      decay: 0.3,
      release: 0.1
    }
  }
});

app.$watch('carrier.attack', (val) => {
  synth.carrierEnvelope.attack = val;
});

app.$watch('carrier.sustain', (val) => {
  synth.carrierEnvelope.sustain = val;
});

app.$watch('carrier.decay', (val) => {
  synth.carrierEnvelope.decay = val;
});

app.$watch('carrier.release', (val) => {
  synth.carrierEnvelope.release = val;
});

app.$watch('modulator.attack', (val) => {
  synth.modulatorEnvelope.attack = val;
});

app.$watch('modulator.sustain', (val) => {
  synth.modulatorEnvelope.sustain = val;
});

app.$watch('modulator.decay', (val) => {
  synth.modulatorEnvelope.decay = val;
});

app.$watch('modulator.release', (val) => {
  synth.modulatorEnvelope.release = val;
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
