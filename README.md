# Convert Kindle HTML notebooks to markdown

This is a script that takes an HTML export of a Kindle notebook and converts it into a nicely formatted markdown file. Supports both highlights as well as notes.

Usage:

```sh
kindle-markdown-notebook [--txt] [--no-rename] file ...
```

Output files will be in the same location as the input file, with the extension changed to `.md`. Use the `--txt` flag to change the file extension to `.txt` instead.

By default, the script will remove the `- Notebook` suffix as well as any characters other than letters, numbers, underscores, hyphens, and dots from the output filename. To keep the original filename with only the extension changed, add the `--no-rename` flag.

## Installation

You'll need [Deno](https://deno.land) installed to run the script.

```sh
# Install Deno if you haven't already:
brew install deno
```

### Option 1: Run directly (if you only need it once):

```sh
deno run --allow-read --allow-write --unstable https://raw.githubusercontent.com/andreasphil/kindle-markdown-notebook/main/kindle-markdown-notebook.js path/to/notebook.html
```

### Option 2: Install permanently

```sh
deno install --allow-read --allow-write --unstable https://raw.githubusercontent.com/andreasphil/kindle-markdown-notebook/main/kindle-markdown-notebook.js
kindle-markdown-notebook path/to/notebook.html
```
