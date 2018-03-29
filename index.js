const audioCtx = new AudioContext();

const destination = audioCtx.createGain();
destination.connect(audioCtx.destination);

const synth = new Synth(audioCtx, destination);

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
