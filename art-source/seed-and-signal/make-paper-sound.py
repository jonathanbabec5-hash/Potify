"""Rebuild the short, dry kraft-paper Foley used when Mira's flap opens."""

import math
import random
import struct
import wave
from pathlib import Path


RATE = 32000
DURATION = 0.56
OUTPUT = (Path(__file__).resolve().parents[2] / "artifacts/potify-high-life/src"
          / "assets/lore/seed-and-signal/packet-unfold.wav")


def render():
    rng = random.Random(713)
    samples = [0.0] * round(RATE * DURATION)
    # A thumb pulls at one corner, then the longer crease gives a little.
    for onset, length, strength, count in [(0.028, 0.11, 0.56, 37),
                                           (0.167, 0.29, 1.0, 104)]:
        for _ in range(count):
            position = rng.betavariate(1.7, 2.3)
            start = int((onset + position * length) * RATE)
            envelope = math.sin(math.pi * position) ** 0.65
            amplitude = strength * envelope * rng.uniform(0.3, 1)
            pitch = rng.uniform(1400, 3900) * (1 - 0.29 * position)
            decay = rng.uniform(0.0025, 0.008)
            tone = 0.0
            for i in range(int(6 * decay * RATE)):
                t = i / RATE
                tone = 0.55 * tone + 0.45 * rng.uniform(-1, 1)
                transient = math.sin(2 * math.pi * pitch * t) + 0.4 * math.sin(2 * math.pi * 1.67 * pitch * t)
                attack = min(t / 0.0007, 1)
                samples[start + i] += amplitude * attack * math.exp(-t / decay) * (0.64 * tone + 0.36 * transient)
    peak = max(map(abs, samples))
    data = b"".join(struct.pack("<h", round(value / peak * 9300)) for value in samples)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT), "wb") as out:
        out.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        out.writeframes(data)


if __name__ == "__main__":
    render()
