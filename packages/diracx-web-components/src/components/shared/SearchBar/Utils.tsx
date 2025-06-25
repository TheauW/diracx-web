import type {
  SearchBarTokenEquation,
  SearchBarToken,
  InternalFilter,
  SearchBarSuggestions,
  EquationAndTokenIndex,
} from "../../../types";

import { EquationStatus, Operators } from "../../../types";

/**
 * @param tokenEquations The list of token equations to be verified.
 * @param setTokenEquations A function to update the state of token equations.
 * This function verifies the validity of each equation and updates their status.
 */
export function handleEquationsVerification(
  tokenEquations: SearchBarTokenEquation[],
  setTokenEquations: React.Dispatch<
    React.SetStateAction<SearchBarTokenEquation[]>
  >,
) {
  tokenEquations = tokenEquations.map(handleEquationVerification);

  if (
    tokenEquations.length > 0 &&
    tokenEquations[tokenEquations.length - 1].status ===
      EquationStatus.INVALID &&
    tokenEquations[tokenEquations.length - 1].items.length < 3
  ) {
    tokenEquations[tokenEquations.length - 1].status = EquationStatus.WAITING;
  }

  setTokenEquations([...tokenEquations]);
}

/**
 * @param tokenEquation The equation to be verified.
 * @returns The equation with its status updated based on its validity.
 */
function handleEquationVerification(
  tokenEquation: SearchBarTokenEquation,
): SearchBarTokenEquation {
  const freeTextOperators = Operators.getFreeTextOperators().map((operator) =>
    operator.getDisplay(),
  );

  if (tokenEquation.items.length === 1) {
    tokenEquation.status =
      tokenEquation.items[0].type === "custom"
        ? EquationStatus.VALID
        : EquationStatus.INVALID;
    return tokenEquation;
  }

  if (tokenEquation.items.length !== 3) {
    tokenEquation.status = EquationStatus.INVALID;
    return tokenEquation;
  }

  switch (tokenEquation.items[0].type) {
    case "category_string":
      if (
        freeTextOperators.includes(tokenEquation.items[1].label as string) ||
        (tokenEquation.items[1].type === "operator_string" &&
          tokenEquation.items[2].type === "value")
      )
        tokenEquation.status = EquationStatus.VALID;
      else tokenEquation.status = EquationStatus.INVALID;
      break;

    case "category_number":
      if (
        freeTextOperators.includes(tokenEquation.items[1].label as string) ||
        (tokenEquation.items[1].type === "operator_number" &&
          !Number.isNaN(Number(tokenEquation.items[2].label)))
      )
        tokenEquation.status = EquationStatus.VALID;
      else tokenEquation.status = EquationStatus.INVALID;
      break;

    case "category_boolean":
      if (
        tokenEquation.items[1].type === "operator_bool" &&
        (tokenEquation.items[2].label === "true" ||
          tokenEquation.items[2].label === "false")
      )
        tokenEquation.status = EquationStatus.VALID;
      else tokenEquation.status = EquationStatus.INVALID;
      break;

    case "category_date":
      if (
        tokenEquation.items[1].type === "operator_date" &&
        (tokenEquation.items[1].label === ">" ||
          tokenEquation.items[1].label === "<") &&
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(
          tokenEquation.items[2].label as string,
        )
      )
        tokenEquation.status = EquationStatus.VALID;
      else if (
        tokenEquation.items[1].label === "in the last" &&
        typeof tokenEquation.items[2].label == "string"
      ) {
        const pattern =
          /^(minute|hour|day|week|month|year)$|^(\d+)\s+(minutes|hours|days|weeks|months|years)$/;

        const match = tokenEquation.items[2].label.match(pattern);
        if (!match) {
          tokenEquation.status = EquationStatus.INVALID;
          return tokenEquation;
        }

        if (match[1]) tokenEquation.status = EquationStatus.VALID;
        else {
          const quantity = parseInt(match[2], 10);
          const unit = match[3];
          const years = (() => {
            switch (unit) {
              case "minutes":
                return quantity / (60 * 24 * 365);
              case "hours":
                return quantity / (24 * 365);
              case "days":
                return quantity / 365;
              case "weeks":
                return quantity / 52;
              case "months":
                return quantity / 12;
              case "years":
                return quantity;
              default:
                return 0;
            }
          })();
          tokenEquation.status =
            years < 2025 ? EquationStatus.VALID : EquationStatus.INVALID;
        }
      }
  }

  return tokenEquation;
}

/**
 *
 * @param focusedTokenIndex The index of the focused token, or null if no token is focused.
 * The structure is { equationIndex: number, tokenIndex: number }.
 * @param tokenEquations The list of token equations.
 * @returns An object containing the index of the previous equation and the index of the previous token.
 */
export function getPreviousEquationAndToken(
  focusedTokenIndex: EquationAndTokenIndex | null,
  tokenEquations: SearchBarTokenEquation[],
) {
  if (focusedTokenIndex) {
    if (focusedTokenIndex.tokenIndex > 0) {
      const previousEquation: SearchBarTokenEquation | undefined =
        tokenEquations[focusedTokenIndex.equationIndex];
      const previousToken =
        previousEquation?.items[focusedTokenIndex.tokenIndex - 1];
      return { previousEquation, previousToken };
    }
    if (
      focusedTokenIndex.equationIndex === 0 &&
      focusedTokenIndex.tokenIndex === 0
    ) {
      return { previousEquation: undefined, previousToken: undefined };
    }
    // else
    const previousEquation =
      tokenEquations[focusedTokenIndex.equationIndex - 1] || undefined;
    const previousToken =
      previousEquation.items[previousEquation.items.length - 1] || undefined;
    return { previousEquation, previousToken };
  }
  // else
  const lastEquation =
    tokenEquations.length > 0
      ? tokenEquations[tokenEquations.length - 1]
      : undefined;
  const lastToken = lastEquation?.items[lastEquation.items.length - 1];

  return { previousEquation: lastEquation, previousToken: lastToken };
}

/**
 * Returns the type of a token based on the previous token and equation.
 * @param value The value of the token to be checked.
 * @param suggestions The suggestions object containing items and their types.
 * @param lastToken The last token in the equation, which can be undefined
 * @returns The type of the token, which can be "custom", "value", "operator", "custom_value", or a category type.
 */
export function getTokenType(
  value: string,
  suggestions: SearchBarSuggestions,
  lastToken: SearchBarToken | undefined,
): string {
  if (suggestions.items.includes(value)) {
    const index = suggestions.items.indexOf(value);
    return suggestions.type[index];
  }
  if (lastToken && lastToken.type.startsWith("operator")) {
    // If the last token is an operator, we assume the current token is a value
    return "custom_value";
  }
  return "custom";
}

/**
 *
 * @param labelList The list of labels to be converted to a string.
 * @returns A string representation of the label list, with each label separated by " | ".
 */
export function convertListToString(labelList: string[] | string): string {
  if (Array.isArray(labelList)) {
    return labelList
      .reduce((acc, label) => acc + label + " | ", "")
      .slice(0, -3); // Remove the last " | "
  }
  return labelList;
}

export async function convertFilterToTokenEquation(
  filter: InternalFilter,
  filterIndex: number,
  createSuggestions: (
    previousToken: SearchBarToken | undefined,
    previousEquation: SearchBarTokenEquation | undefined,
    filterIndex?: number,
  ) => Promise<SearchBarSuggestions>,
): Promise<SearchBarTokenEquation> {
  const newEquation: SearchBarTokenEquation = {
    items: [
      { label: filter.parameter, type: "category" },
      {
        label: Operators.getDisplayFromInternal(filter.operator),
        type: "operator",
      },
      { label: filter.value || filter.values || "", type: "value" },
    ],
    status: EquationStatus.VALID,
  };

  const suggestions_categories = await createSuggestions(
    undefined,
    undefined,
    filterIndex,
  );

  newEquation.items[0].type =
    suggestions_categories.type[
      suggestions_categories.items.indexOf(filter.parameter)
    ] || "category";

  const suggestions_operators = await createSuggestions(
    newEquation.items[0],
    newEquation,
    filterIndex,
  );

  newEquation.items[1].type =
    suggestions_operators.type[
      suggestions_operators.items.indexOf(
        Operators.getDisplayFromInternal(filter.operator),
      )
    ] || "operator";

  const suggestions_values = await createSuggestions(
    newEquation.items[1],
    newEquation,
    filterIndex,
  );

  newEquation.items[1].suggestions = suggestions_operators;
  newEquation.items[2].suggestions = suggestions_values;

  return newEquation;
}
