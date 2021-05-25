# Convert Kindle HTML notebooks to markdown

This is a script that takes an HTML export of a Kindle notebook and converts it into a nicely formatted markdown file. Supports both highlights as well as notes.

Usage:

```sh
kindle-markdown-notebook [file ...]
```

Output files will be in the same location as the input file, with the extension changed to `.md`.

## Installation

You'll need [Deno](https://deno.land) installed to run the script.

```sh
# Install Deno if you haven't already:
brew install deno

# Download a copy:
curl -OJ https://raw.githubusercontent.com/andreasphil/kindle-markdown-notebook/main/kindle-markdown-notebook.js

# Option 1: Run directly (if you only need it once):
deno run --allow-read --allow-write --unstable kindle-markdown-notebook.js path/to/notebook.html

# Option 2: Install permanently
deno install --allow-read --allow-write --unstable kindle-markdown-notebook.js
kindle-markdown-notebook path/to/notebook.html
```
