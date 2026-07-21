const HEADING_PATTERN =
    /^##\s+(.+)$/;

const QUOTE_PATTERN =
    /^>\s?(.*)$/;

const LIST_PATTERN =
    /^-\s+(.+)$/;

const REFERENCE_PATTERN =
    /^\[(\d+)\]\s+(.+)$/;

function normalizeSource(source) {
    return String(source ?? "")
        .replace(/\r\n?/g, "\n")
        .trim();
}

function isSpecialLine(line) {
    return HEADING_PATTERN.test(line) ||
        QUOTE_PATTERN.test(line) ||
        LIST_PATTERN.test(line);
}

export function parseDetailBody(
    source
) {
    const normalized =
        normalizeSource(source);

    if (!normalized) {
        return [];
    }

    const lines =
        normalized.split("\n");

    const blocks = [];
    let index = 0;
    let inReferenceSection = false;

    while (index < lines.length) {
        const line =
            lines[index].trim();

        if (!line) {
            index += 1;
            continue;
        }

        const headingMatch =
            line.match(
                HEADING_PATTERN
            );

        if (headingMatch) {
            const text =
                headingMatch[1].trim();

            inReferenceSection =
                text === "参考资料";

            blocks.push({
                type: "heading",
                text,
                isReferenceHeading:
                    inReferenceSection
            });

            index += 1;
            continue;
        }

        if (inReferenceSection) {
            const referenceMatch =
                line.match(
                    REFERENCE_PATTERN
                );

            if (referenceMatch) {
                blocks.push({
                    type: "reference",
                    number:
                        referenceMatch[1],
                    text:
                        referenceMatch[2]
                            .trim()
                });

                index += 1;
                continue;
            }
        }

        const quoteMatch =
            line.match(
                QUOTE_PATTERN
            );

        if (quoteMatch) {
            const quoteLines = [];

            while (
                index < lines.length
            ) {
                const current =
                    lines[index].trim();

                const currentMatch =
                    current.match(
                        QUOTE_PATTERN
                    );

                if (!currentMatch) {
                    break;
                }

                quoteLines.push(
                    currentMatch[1]
                        .trim()
                );

                index += 1;
            }

            blocks.push({
                type: "quote",
                lines: quoteLines
            });

            continue;
        }

        const listMatch =
            line.match(
                LIST_PATTERN
            );

        if (listMatch) {
            const items = [];

            while (
                index < lines.length
            ) {
                const current =
                    lines[index].trim();

                const currentMatch =
                    current.match(
                        LIST_PATTERN
                    );

                if (!currentMatch) {
                    break;
                }

                items.push(
                    currentMatch[1]
                        .trim()
                );

                index += 1;
            }

            blocks.push({
                type: "list",
                items
            });

            continue;
        }

        const paragraphLines = [
            line
        ];

        index += 1;

        while (index < lines.length) {
            const current =
                lines[index].trim();

            if (
                !current ||
                isSpecialLine(current)
            ) {
                break;
            }

            if (
                inReferenceSection &&
                REFERENCE_PATTERN.test(
                    current
                )
            ) {
                break;
            }

            paragraphLines.push(
                current
            );

            index += 1;
        }

        blocks.push({
            type: "paragraph",
            text:
                paragraphLines.join(" ")
        });
    }

    return blocks;
}

export function collectReferenceNumbers(
    blocks
) {
    return new Set(
        blocks
            .filter(
                (block) =>
                    block.type ===
                    "reference"
            )
            .map(
                (block) =>
                    String(block.number)
            )
    );
}
