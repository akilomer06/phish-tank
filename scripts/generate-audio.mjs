import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(
  new URL('../client/public/audio/', import.meta.url),
);
mkdirSync(output, { recursive: true });
const tracks = {
  tap: [660],
  success: [523, 659, 784],
  fail: [220, 165],
  tick: [880],
  reveal: [220, 330, 440, 660],
  crack: [440, 220, 110],
  siren: [440, 660, 440, 660],
  victory: [523, 659, 784, 1047],
};
for (const [name, notes] of Object.entries(tracks)) {
  const rate = 22050;
  const duration = name === 'tap' ? 0.055 : name === 'tick' ? 0.08 : 0.15;
  const perNote = Math.floor(rate * duration);
  const samples = perNote * notes.length;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    const t = (i % perNote) / perNote;
    const envelope = Math.min(t * 20, 1) * (1 - t) ** 2;
    const frequency = notes[Math.floor(i / perNote)];
    wav.writeInt16LE(
      Math.round(
        Math.sin((2 * Math.PI * frequency * i) / rate) * envelope * 16000,
      ),
      44 + i * 2,
    );
  }
  writeFileSync(`${output}/${name}.wav`, wav);
}
