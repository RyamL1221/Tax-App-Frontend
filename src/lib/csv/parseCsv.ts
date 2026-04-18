/**
 * Parses raw CSV text into a 2D array of strings.
 * Handles: comma delimiters, quoted fields, escaped quotes (""),
 * \n and \r\n line endings, trailing newline.
 */
export function parseCsv(csvText: string): string[][] {
  if (csvText === '') return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ""
        if (i + 1 < csvText.length && csvText[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i += 2;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Handle last field/row — only add if there's content
  // A trailing newline should not produce an extra empty row
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Converts a 2D array of strings back into CSV text.
 * Fields containing commas, quotes, or newlines are quoted.
 * Quotes within fields are escaped as "".
 * Rows are joined with \n.
 */
export function prettyPrintCsv(data: string[][]): string {
  if (data.length === 0) return '';

  return data
    .map((row) =>
      row
        .map((field) => {
          if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        })
        .join(',')
    )
    .join('\n');
}
