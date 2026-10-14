import type { MathSymbolItem } from '../constants/mathSymbols';

/**
 * Checks whether a given position in text is currently inside an unescaped,
 * properly paired inline ($...$) or display ($$...$$) math block.
 * A single unmatched $ (e.g. "It costs $5") does NOT count as opening math;
 * there must be a matching closing delimiter somewhere after it.
 */
export function isCursorInsideMath(text: string, pos: number): boolean {
  if (!text || pos < 0 || pos > text.length) return false;

  let i = 0;
  while (i < text.length) {
    // Skip escaped characters (e.g. \$)
    if (text[i] === '\\') {
      i += 2;
      continue;
    }

    // Check for display math $$...$$
    if (text[i] === '$' && text[i + 1] === '$') {
      const innerStart = i + 2;
      let closeStart = -1;
      let j = innerStart;

      while (j < text.length) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '$' && text[j + 1] === '$') {
          closeStart = j;
          break;
        }
        j++;
      }

      if (closeStart !== -1) {
        if (pos >= innerStart && pos <= closeStart) {
          return true;
        }
        i = closeStart + 2;
        continue;
      } else {
        // Unmatched $$, not a valid math pair
        break;
      }
    }

    // Check for inline math $...$
    if (text[i] === '$') {
      const innerStart = i + 1;
      let closeStart = -1;
      let j = innerStart;

      while (j < text.length) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '$') {
          closeStart = j;
          break;
        }
        j++;
      }

      if (closeStart !== -1) {
        if (pos >= innerStart && pos <= closeStart) {
          return true;
        }
        i = closeStart + 1;
        continue;
      } else {
        // Unmatched $, not a valid math pair (e.g. "It costs $5")
        break;
      }
    }

    i++;
  }

  return false;
}

export interface InsertResult {
  newText: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Computes the smart replacement and new selection range when a symbol or template
 * is clicked, considering text selection, math delimiters, and empty brace placement.
 */
export function calculateMathInsertion(
  currentText: string,
  start: number,
  end: number,
  symbol: MathSymbolItem
): InsertResult {
  const before = currentText.substring(0, start);
  const selected = currentText.substring(start, end);
  const after = currentText.substring(end);

  // Plain Unicode symbols (e.g. +, −, ±, ×, π, ≤, →, °, ∈)
  if (!symbol.isTemplate) {
    const textToInsert = symbol.insert;
    const newText = before + textToInsert + after;
    const nextPos = start + textToInsert.length;
    return {
      newText,
      selectionStart: nextPos,
      selectionEnd: nextPos,
    };
  }

  // Check if cursor is already within a math delimiter
  const insideMath = isCursorInsideMath(currentText, start);
  const prefix = insideMath ? '' : '$';
  const suffix = insideMath ? '' : '$';

  let snippet = '';
  let selStartOffset = 0;
  let selEndOffset = 0;

  switch (symbol.templateType) {
    case 'sqrt': {
      if (selected.length > 0) {
        snippet = `${prefix}\\sqrt{${selected}}${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\sqrt{}${suffix}`;
        // Put cursor inside empty braces
        selStartOffset = prefix.length + 6; // right after \sqrt{
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'fraction': {
      if (selected.length > 0) {
        // Put selection in numerator, place cursor inside empty denominator
        snippet = `${prefix}\\frac{${selected}}{}${suffix}`;
        selStartOffset = prefix.length + 6 + selected.length + 2; // right inside denominator {}
        selEndOffset = selStartOffset;
      } else {
        // Put cursor inside numerator empty braces
        snippet = `${prefix}\\frac{}{}${suffix}`;
        selStartOffset = prefix.length + 6; // right after \frac{
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'power_square': {
      const base = selected.length > 0 ? selected : 'x';
      snippet = `${prefix}${base}^2${suffix}`;
      selStartOffset = snippet.length;
      selEndOffset = snippet.length;
      break;
    }

    case 'power_n': {
      const base = selected.length > 0 ? selected : 'x';
      snippet = `${prefix}${base}^{n}${suffix}`;
      // Highlight 'n' so user can type the exponent immediately
      const nIndex = snippet.indexOf('{n}') + 1;
      selStartOffset = nIndex;
      selEndOffset = nIndex + 1;
      break;
    }

    case 'power_10n': {
      if (selected.length > 0) {
        snippet = `${prefix}10^{${selected}}${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}10^{n}${suffix}`;
        const nIndex = snippet.indexOf('{n}') + 1;
        selStartOffset = nIndex;
        selEndOffset = nIndex + 1;
      }
      break;
    }

    case 'chem': {
      if (selected.length > 0) {
        snippet = `${prefix}\\ce{${selected}}${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\ce{}${suffix}`;
        selStartOffset = prefix.length + 4; // inside \ce{}
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'integral_bounds': {
      if (selected.length > 0) {
        snippet = `${prefix}\\int_{a}^{b} ${selected} dx${suffix}`;
      } else {
        snippet = `${prefix}\\int_{a}^{b} dx${suffix}`;
      }
      // Highlight the lower bound 'a'
      const aIndex = snippet.indexOf('{a}') + 1;
      selStartOffset = aIndex;
      selEndOffset = aIndex + 1;
      break;
    }

    case 'integral_simple': {
      if (selected.length > 0) {
        snippet = `${prefix}\\int ${selected} dx${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\int dx${suffix}`;
        selStartOffset = prefix.length + 5; // right before 'dx'
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'derivative': {
      if (selected.length > 0) {
        snippet = `${prefix}\\frac{d${selected}}{dx}${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\frac{d}{dx}${suffix}`;
        selStartOffset = prefix.length + 7; // after d
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'partial_derivative': {
      snippet = `${prefix}\\frac{\\partial}{\\partial x}${suffix}`;
      selStartOffset = snippet.length;
      selEndOffset = snippet.length;
      break;
    }

    case 'sum': {
      snippet = `${prefix}\\sum_{i=1}^{n} ${selected}${suffix}`;
      selStartOffset = snippet.length - suffix.length;
      selEndOffset = selStartOffset;
      break;
    }

    case 'limit': {
      snippet = `${prefix}\\lim_{x \\to 0} ${selected}${suffix}`;
      selStartOffset = snippet.length - suffix.length;
      selEndOffset = selStartOffset;
      break;
    }

    case 'ln': {
      if (selected.length > 0) {
        snippet = `${prefix}\\ln(${selected})${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\ln()${suffix}`;
        selStartOffset = prefix.length + 4; // inside ()
        selEndOffset = selStartOffset;
      }
      break;
    }

    case 'log': {
      if (selected.length > 0) {
        snippet = `${prefix}\\log(${selected})${suffix}`;
        selStartOffset = snippet.length;
        selEndOffset = snippet.length;
      } else {
        snippet = `${prefix}\\log()${suffix}`;
        selStartOffset = prefix.length + 5; // inside ()
        selEndOffset = selStartOffset;
      }
      break;
    }

    default: {
      snippet = `${prefix}${symbol.insert}${suffix}`;
      selStartOffset = snippet.length;
      selEndOffset = snippet.length;
      break;
    }
  }

  const newText = before + snippet + after;
  return {
    newText,
    selectionStart: start + selStartOffset,
    selectionEnd: start + selEndOffset,
  };
}

/**
 * Helper to perform symbol insertion directly onto a textarea or text input DOM element.
 * Updates text, triggers onChange, restores focus, and positions the cursor.
 */
export function insertSymbolIntoInputOrTextarea(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  currentValue: string,
  symbol: MathSymbolItem,
  onValueChange: (val: string) => void
): void {
  if (!element) {
    const res = calculateMathInsertion(currentValue, currentValue.length, currentValue.length, symbol);
    onValueChange(res.newText);
    return;
  }

  const start = element.selectionStart ?? currentValue.length;
  const end = element.selectionEnd ?? currentValue.length;

  const { newText, selectionStart, selectionEnd } = calculateMathInsertion(
    currentValue,
    start,
    end,
    symbol
  );

  onValueChange(newText);

  // Return focus and set precise cursor or selection position
  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(selectionStart, selectionEnd);
  });
}

/** Backward-compatible alias */
export const insertSymbolIntoTextarea = insertSymbolIntoInputOrTextarea;

export const CALCULATION_STEPS_TEMPLATE = `Given:
- 

Formula:
- 

Working Steps:
1. 
2. 

Final Answer:
- `;

/**
 * Helper to insert a calculation template into an input or textarea element,
 * maintaining cursor and selection properly.
 */
export function insertTemplateIntoInputOrTextarea(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  currentValue: string,
  onValueChange: (val: string) => void,
  template: string = CALCULATION_STEPS_TEMPLATE
): void {
  if (!element) {
    const res = currentValue ? `${currentValue}\n\n${template}` : template;
    onValueChange(res);
    return;
  }

  if (!currentValue.trim()) {
    onValueChange(template);
    requestAnimationFrame(() => {
      element.focus();
    });
  } else {
    const start = element.selectionStart ?? currentValue.length;
    const end = element.selectionEnd ?? currentValue.length;
    const before = currentValue.substring(0, start);
    const after = currentValue.substring(end);
    const addition = `\n\n` + template;
    const updated = before + addition + after;
    onValueChange(updated);
    requestAnimationFrame(() => {
      element.focus();
      const nextPos = start + addition.length;
      element.setSelectionRange(nextPos, nextPos);
    });
  }
}

