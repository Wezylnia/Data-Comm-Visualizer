# Data Communication Modulation Visualizer

A web-based tool to visualize digital modulation techniques including ASK, FSK, PSK, and QAM. It provides interactive symbol mapping tables, constellation diagrams, and time-domain waveforms.

## Features

- **Modulation Types**: Supports ASK, FSK, PSK, and QAM.
- **Modulation Levels**: Supports 2, 4, 8, and 16 levels (4, 8, 16 for QAM).
- **Symbol Mapping**: Displays a detailed mapping table for each bit string to its corresponding physical parameter (Amplitude, Frequency, or Phase).
- **Constellation Diagrams**: Interactive I-Q plots (for PSK/QAM) and parameter dot charts (for ASK/FSK).
- **Time-Domain Waveforms**: Detailed signal visualization with synchronized digital data bit-stream display.
- **GitHub Pages Ready**: Pure HTML/CSS/JS implementation with no build step required.

## Technical Details

- **Mapping**: Uses Natural Binary mapping for bit-to-symbol assignment.
- **Rendering**: Charts are powered by Plotly.js.
- **Styling**: Modern, responsive interface using CSS Flexbox and Grid.
- **Mathematics**: Implements standard sine-wave carrier modulation with precise phase and amplitude calculations.

## Usage

1. Enter a bit sequence (e.g., `101100`).
2. Select the modulation technique and M-level.
3. Click 'Draw' to generate the mapping table and visualizations.
