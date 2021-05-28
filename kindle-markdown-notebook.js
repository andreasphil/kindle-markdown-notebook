import { exists } from "https://deno.land/std@0.97.0/fs/mod.ts";
import { basename, extname } from "https://deno.land/std@0.97.0/path/mod.ts";
import { cheerio } from "https://deno.land/x/cheerio@1.0.4/mod.ts";

/**
 * @typedef Highlight
 * @property {String} heading
 * @property {String} text
 */

/**
 * @typedef Notebook
 * @property {Array<String>} authors
 * @property {String} title
 * @property {Array<Highlight>} highlights
 */

/**
 * @typedef Options
 * @property {String} extension Output file extension
 * @property {function} namingStrategy Generator for naming output files
 * @property {Array<String>} includeEls Selectors containing highlight
 *  information in the notebook
 * @property {String} authorsEl Selector containing author names
 * @property {String} titleEl Selector containing the book title
 * @property {Array<RegExp>} skip Skip nodes where the text content matches
 *  these regexes when parsing highlights
 */

/**
 * Output file naming strategy that keep the original name and only replaces the
 * extension.
 *
 * @param {String} path
 * @param {String} extension
 * @returns {String}
 */
function keepFilename(path, extension) {
  return path.replace(/.html$/, extension);
}

/**
 * Output file naming strategy that removes any characters other than letters,
 * numbers, underscores, dashes and dots from the original name.
 *
 * @param {String} path
 * @param {String} extension
 * @returns {String}
 */
function prettyFilename(path, extension) {
  const current = basename(path);
  let next = current.replace(" - Notebook.html", extension);
  next = next.replace(/[^\w\s-\.]+/g, "");

  return path.replace(current, next);
}

/**
 * Convert a list of highlights, given as Cheerio nodes, to a plain object
 * array for easier processing.
 *
 * @param {CheerioAPI} $ document context
 * @param {Array<Node>} highlights highlights from the notebook
 * @param {Array<Highlight>} group already processed groups
 * @returns {Array<Highlight>} processed groups
 */
function parseHighlights($, highlights, groups = []) {
  // Heading and text are sibling elements in the notebook export, so they
  // should always come in pairs
  let [heading, text, ...rest] = highlights;

  heading = heading ? $(heading).text().trim() : "";
  text = text ? $(text).text().trim() : "";

  const newGroups = [...groups, { heading, text }];

  if (rest && rest.length > 0) {
    return parseHighlights($, rest, newGroups);
  } else {
    return newGroups;
  }
}

/**
 * Takes a string with the HTML from an exported notebook and converts it into
 * a generic JS data structure for further processing.
 *
 * @param {String} html
 * @param {Options} options
 * @returns {Notebook}
 */
function parseNotebook(html, options) {
  const { includeEls, authorsEl, titleEl, skip } = options;
  const $ = cheerio.load(html);

  // Authors
  const authors = $(authorsEl)
    .text()
    .split("; ")
    .map((author) => {
      const [lastname = "", firstname = ""] = author.trim().split(", ");
      return `${firstname} ${lastname}`.trim();
    });

  // Book title
  const title = $(titleEl).text().trim();

  // Highlights
  const selector = includeEls.join(",");
  const els = $(selector)
    .toArray()
    .filter((el) => {
      let skipped = false;

      for (let i = 0; i < skip.length && !skipped; i++) {
        skipped = !!$(el).text().trim().match(skip[0]);
      }

      return !skipped;
    });
  const highlights = parseHighlights($, els);

  return { title, authors, highlights };
}

/**
 * Converts a parsed notebook into a markdown string.
 *
 * @param {Notebook} notebook
 * @returns {String}
 */
function toMarkdown(notebook) {
  return `# ${notebook.title}, by ${notebook.authors.join(" and ")}

${
    notebook.highlights
      .map(({ heading, text }) => `## ${heading}\n\n${text}`)
      .join("\n\n")
  }
`;
}

/**
 * Converts an HTML notebook into a markdown file and writes it in the same
 * location as the source file.
 *
 * @param {String} path
 * @param {Options} options
 */
function process(path, options) {
  const { extension, namingStrategy } = options;
  const filename = basename(path);
  const out = namingStrategy(path, extension);

  if (extname(path) !== ".html") {
    console.log(`🙁 "${filename}" is not a supported filetype`);
    return;
  }

  exists(path)
    .then((result) => {
      if (result) {
        return Deno.readTextFile(path);
      } else {
        throw new Error("File does not exist");
      }
    })
    .then((html) => {
      const notes = parseNotebook(html, options);
      const md = toMarkdown(notes);
      return Deno.writeTextFile(out, md);
    })
    .then(() => {
      console.log(`✅ ${basename(out)}`);
    })
    .catch((err) => {
      console.log(`🚨 ${filename}: ${err}`);
    });
}

/** @type Options */
const options = {
  extension: ".md",
  namingStrategy: prettyFilename,
  includeEls: [".noteHeading", ".noteText"],
  authorsEl: ".authors",
  titleEl: ".bookTitle",
  skip: [/^Bookmark.*$/],
};

const paths = [];

Deno.args.forEach((arg) => {
  switch (arg) {
    case "--txt":
      options.extension = ".txt";
      break;
    case "--no-rename":
      options.namingStrategy = keepFilename;
      break;
    default:
      paths.push(arg);
  }
});

paths.forEach((path) => process(path, options));
