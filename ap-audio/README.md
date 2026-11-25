# Audio sources and verification — Iowa prototype 1

This pack contains 72 individual acoustic recordings: violin and piano, MIDI 60–95 (C4–B6), one independent recorded take for each instrument/pitch. No missing pitch was manufactured from an adjacent note. The violin recordings are bowed (arco), not pizzicato or an ensemble. The pack is an automated-quality-checked prototype, not a fully listening-validated training corpus.

## Source and permission

University of Iowa Musical Instrument Samples, created by Lawrence Fritts and the University of Iowa Electronic Music Studios.

- Permission and recording methods: https://theremin.music.uiowa.edu/MIS.html
- Violin source index: https://theremin.music.uiowa.edu/MIS-Pitches-2012/MISViolin2012.html
- Piano source index: https://theremin.music.uiowa.edu/MISpiano.html

The official permission states that recordings may be "downloaded and used for any projects, without restrictions." This is the university's permission statement; this pack does not relabel the source as CC0. The page specifically includes application developers among its users. Individual original file URLs are retained in `sources.json`.

The violin source index identifies a Nicolai Tambovsky (1998) violin performed by Leonid Iogansen, recorded on 2011-12-11 in an anechoic chamber. This selection uses its ff arco stereo recordings, downmixed to mono. The piano samples use the mf recording layer. The source documentation does not explicitly identify these selected violin takes as non-vibrato.

## Processing

1. Decode the individual source recording at 44.1 kHz mono. Some long piano source files were downloaded as their initial byte prefix; the retained prefix contains the complete selected opening excerpt. The manifest distinguishes such downloads and hashes the actual downloaded bytes.
2. Detect the onset using a 10 ms RMS envelope and retain 15 ms before the detected onset when available.
3. Estimate the median fundamental-frequency offset from the expected note using several spectral harmonics and multiple overlapping analysis frames. Apply one small constant resampling correction to that same recorded note, targeting A4 = 440 Hz and twelve-tone equal temperament. This is per-note tuning calibration, not transposition of one note to create other notes; no time-varying pitch flattening is applied.
4. Make a 1.2 s stimulus, with a 5 ms initial fade and 80 ms terminal fade. Preserve the natural attack; pad only where needed.
5. Normalize whole-stimulus RMS toward −26 dBFS, with a −2 dBFS peak ceiling. This is RMS matching, not a claim of exact subjective equal loudness across pitch and instrument.
6. Encode mono 44.1 kHz MP3 at 96 kbit/s. Decode the MP3 again and measure pitch, duration, RMS and peak levels.

## Validation boundaries

- Automated checks cover complete pitch/instrument coverage, unique source downloads, decoding, duration, numerical median tuning, within-stimulus pitch variation, level and peak values. A separate broad-range YIN-style period estimator checks note identity without being given the expected MIDI pitch; all 72 files passed that note-identity check. Aggregate results are in `quality.json`.
- The spectral estimator is constrained near the expected note and is not an independent certification of human-perceived pitch or musical quality. Its sub-cent median residuals describe this measurement procedure, not absolute metrological accuracy.
- No complete human listening review has yet been performed. Bow noise, transient quality, audible artifacts and perceived loudness still need listening review. Do not describe this pack as fully verified non-vibrato material.
- There is only one independent take per instrument/MIDI note. Training on this pack does not establish generalization to a different recording, performer or instrument.
- Early exploratory pre-2012 violin scale files were not included. Their irregular note coverage and larger tuning deviations require separate segmentation and validation before use.
- The source provenance and the `qualityStatus` field must remain attached to learner records so later source changes can be separated from learning changes.

Each bank contains twelve separate MP3 files from one instrument and octave. The offset and byte count in sources.json locate each individual MP3.
