import * as cheerio from "cheerio";

function cleanText(text) {
    return text
        .replace(/\s+/g, " ")
        .replace(/\u00a0/g, " ")
        .trim();
}

function cleanUrl(url) {
    if (!url) {
        return null;
    }

    if (url.startsWith("//")) {
        return `https:${url}`;
    }

    if (url.startsWith("/")) {
        return `https://openstax.org${url}`;
    }

    return url;
}

function extractFigure($, element) {
    const figure = $(element);

    const image = figure.find("img").first();

    const src =
        image.attr("src") ||
        image.attr("data-src") ||
        image.attr("data-original") ||
        null;

    const alt = cleanText(image.attr("alt") || "");

    const caption = cleanText(
        figure
            .find("figcaption")
            .first()
            .text()
    );

    return {
        type: "figure",
        image: {
            src: cleanUrl(src),
            alt
        },
        caption
    };
}

function extractNote($, element) {
    const note = $(element);

    const title = cleanText(
        note
            .find(".os-note-title, .os-title, h3, h4, .note-title")
            .first()
            .text()
    );

    const body = cleanText(
        note
            .find(".os-note-body")
            .first()
            .text() || note.text()
    );

    return {
        type: "note",
        title,
        text: body
    };
}

function extractList($, element) {
    const list = $(element);

    const items = list
        .children("li")
        .map((_, item) => {
            return cleanText($(item).text());
        })
        .get()
        .filter(Boolean);

    return {
        type: "list",
        ordered: element.tagName.toLowerCase() === "ol",
        items
    };
}

function extractTable($, element) {
    const table = $(element);

    const rows = [];

    table.find("tr").each((_, row) => {
        const cells = [];

        $(row)
            .children("th, td")
            .each((_, cell) => {
                cells.push(cleanText($(cell).text()));
            });

        if (cells.length > 0) {
            rows.push(cells);
        }
    });

    return {
        type: "table",
        rows
    };
}

function extractEquation($, element) {
    const equation = $(element);

    const latex =
        equation.attr("data-latex") ||
        equation.attr("data-math") ||
        equation.find("annotation[encoding='application/x-tex']").first().text() ||
        null;

    const text = cleanText(equation.text());

    return {
        type: "equation",
        latex,
        text
    };
}

function extractExample($, element) {
    const example = $(element);

    const title = cleanText(
        example
            .find(".os-title, .example-title, h3, h4")
            .first()
            .text()
    );

    const text = cleanText(example.text());

    return {
        type: "example",
        title,
        text
    };
}

export function extractOpenStaxContent(html) {
    const $ = cheerio.load(html);

    const mainContent = $("#main-content");

    if (!mainContent.length) {
        throw new Error("Could not find OpenStax main content");
    }

    /*
     * OpenStax pages contain the section title as an H2.
     */
    const pageTitle = cleanText(
        mainContent
            .find("h2")
            .first()
            .text()
    );

    const content = [];

    /*
     * We iterate through the direct document structure rather than
     * blindly selecting every h3/h4/p/li.
     *
     * This prevents nested content inside figures, notes, lists, etc.
     * from being extracted multiple times.
     */
    function processChildren(parent) {
        $(parent)
            .children()
            .each((_, element) => {
                const node = $(element);

                const tag = element.tagName
                    ? element.tagName.toLowerCase()
                    : "";

                const classes = node.attr("class") || "";

                /*
                 * ----------------------------------------
                 * FIGURES
                 * ----------------------------------------
                 *
                 * OpenStax may have:
                 *
                 * div.os-figure
                 *      └── figure
                 *
                 * Selecting both creates duplicates.
                 *
                 * Therefore we only process the outer .os-figure.
                 */

                if (node.hasClass("os-figure")) {
                    content.push(
                        extractFigure($, element)
                    );

                    return;
                }

                /*
                 * If we encounter a raw figure that isn't already
                 * contained inside .os-figure, process it.
                 */

                if (
                    tag === "figure" &&
                    !node.parents(".os-figure").length
                ) {
                    content.push(
                        extractFigure($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * NOTES / CALLOUTS
                 * ----------------------------------------
                 */

                if (
                    node.hasClass("os-note") ||
                    node.hasClass("os-note-body") ||
                    classes.includes("spotlight-")
                ) {
                    /*
                     * If this is the inner os-note-body and there is
                     * an outer .os-note, don't process it separately.
                     */

                    if (
                        node.hasClass("os-note-body") &&
                        node.parents(".os-note").length
                    ) {
                        return;
                    }

                    content.push(
                        extractNote($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * TABLES
                 * ----------------------------------------
                 */

                if (tag === "table") {
                    content.push(
                        extractTable($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * EXAMPLES
                 * ----------------------------------------
                 */

                if (
                    node.hasClass("os-example") ||
                    node.hasClass("example") ||
                    classes.includes("example")
                ) {
                    content.push(
                        extractExample($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * EQUATIONS
                 * ----------------------------------------
                 */

                if (
                    tag === "math" ||
                    node.hasClass("os-equation") ||
                    node.attr("data-type") === "equation"
                ) {
                    content.push(
                        extractEquation($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * HEADINGS
                 * ----------------------------------------
                 */

                if (
                    tag === "h3" ||
                    tag === "h4" ||
                    tag === "h5" ||
                    tag === "h6"
                ) {
                    const text = cleanText(node.text());

                    if (text) {
                        content.push({
                            type: "heading",
                            level: Number(tag.substring(1)),
                            text
                        });
                    }

                    return;
                }

                /*
                 * ----------------------------------------
                 * PARAGRAPHS
                 * ----------------------------------------
                 */

                if (tag === "p") {
                    const text = cleanText(node.text());

                    if (text) {
                        content.push({
                            type: "paragraph",
                            text
                        });
                    }

                    return;
                }

                /*
                 * ----------------------------------------
                 * LISTS
                 * ----------------------------------------
                 */

                if (tag === "ul" || tag === "ol") {
                    content.push(
                        extractList($, element)
                    );

                    return;
                }

                /*
                 * ----------------------------------------
                 * OTHER CONTAINERS
                 * ----------------------------------------
                 *
                 * For divs and other structural containers,
                 * recursively process their children.
                 */

                if (
                    tag === "div" ||
                    tag === "section" ||
                    tag === "article"
                ) {
                    processChildren(element);
                }
            });
    }

    processChildren(mainContent[0]);

    return {
        title: pageTitle,
        content
    };
}