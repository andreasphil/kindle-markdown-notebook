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
 * Convert a list of highlights, given as Cheerio nodes, to a plain object
 * array for easier processing.
 *
 * @param {CheerioAPI} $ document context
 * @param {Array<Node>} highlights highlights from the notebook
 * @param {Array<Highlight>} groups already processed groups
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
 * @returns {Notebook}
 */
function parseNotebook(html) {
  const $ = cheerio.load(html);

  // Authors
  const authors = $(".authors")
    .text()
    .split("; ")
    .map((author) => {
      const [lastname = "", firstname = ""] = author.trim().split(", ");
      return `${firstname} ${lastname}`.trim();
    });

  // Book title
  const title = $(".bookTitle").text().trim();

  // Highlights
  const highlights = parseHighlights($, $(".noteHeading,.noteText").toArray());

  return { title, authors, highlights };
}

/**
 * Converts a parsed notebook into a markdown string.
 *
 * @param {Notebook} notebook
 * @returns {String}
 */
function toMarkdown(notebook) {
  return `# "${notebook.title}" by ${notebook.authors.join(" and ")}

${notebook.highlights
  .map(({ heading, text }) => `## ${heading}\n\n${text}`)
  .join("\n\n")}
`;
}

/**
 * Converts an HTML notebook into a markdown file and writes it in the same
 * location as the source file.
 *
 * @param {String} path
 */
function process(path) {
  const filename = basename(path);

  if (extname(path) !== "html") {
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
      const notes = parseNotebook(html);
      const md = toMarkdown(notes);

      return Deno.writeTextFile(path.replace(/.html$/, ".md"), md);
    })
    .then(() => {
      console.log(`✅ ${filename}`);
    })
    .catch((err) => {
      console.log(`🚨 ${filename}: ${err}`);
    });
}

Deno.args.forEach((path) => process(path));
