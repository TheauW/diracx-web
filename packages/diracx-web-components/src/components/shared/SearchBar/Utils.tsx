import { Button, ButtonGroup, Box } from "@mui/material";

import type {
  SearchBarTokenEquation,
  SearchBarToken,
  InternalFilter,
  JobSummary,
  SearchBarSuggestions,
} from "../../../types";

import type { Data, EquationAndTokenIndex } from "./Types";

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
    tokenEquations[tokenEquations.length - 1].status === "invalid" &&
    tokenEquations[tokenEquations.length - 1].items.length < 3
  ) {
    tokenEquations[tokenEquations.length - 1].status = "waiting";
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
  const freeTextOperators = [
    "like",
    "not like",
    "is in",
    "is not in",
    "in the last",
    "<",
    "<=",
  ];

  if (tokenEquation.items.length === 1) {
    tokenEquation.status =
      tokenEquation.items[0].type === "custom" ? "valid" : "invalid";
    return tokenEquation;
  }

  if (tokenEquation.items.length !== 3) {
    tokenEquation.status = "invalid";
    return tokenEquation;
  }

  switch (tokenEquation.items[0].type) {
    case "category_string":
      if (
        freeTextOperators.includes(tokenEquation.items[1].label as string) ||
        (tokenEquation.items[1].type === "operator_string" &&
          tokenEquation.items[2].type === "value")
      )
        tokenEquation.status = "valid";
      else tokenEquation.status = "invalid";
      break;

    case "category_number":
      if (
        freeTextOperators.includes(tokenEquation.items[1].label as string) ||
        (tokenEquation.items[1].type === "operator_number" &&
          !Number.isNaN(Number(tokenEquation.items[2].label)))
      )
        tokenEquation.status = "valid";
      else tokenEquation.status = "invalid";
      break;

    case "category_boolean":
      if (
        tokenEquation.items[1].type === "operator_bool" &&
        (tokenEquation.items[2].label === "true" ||
          tokenEquation.items[2].label === "false")
      )
        tokenEquation.status = "valid";
      else tokenEquation.status = "invalid";
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
        tokenEquation.status = "valid";
      else if (tokenEquation.items[1].label === "in the last") {
        const pattern =
          /^(minute|hour|day|week|month|year)$|^\d+ (minutes|hours|days|weeks|months|years)$/;

        tokenEquation.status = pattern.test(
          tokenEquation.items[2].label as string,
        )
          ? "valid"
          : "invalid";
      }
  }

  return tokenEquation;
}

/**
 *
 * @param previousToken The previous token, which can be undefined if no token is focused.
 * @param previousEquation The previous equation, which can be undefined if no equation is focused.
 * @param data The data to be used for suggestions.
 * @returns A list of suggestions based on the current tokens and data.
 */
export function createSuggestions(
  previousToken: SearchBarToken | undefined,
  previousEquation: SearchBarTokenEquation | undefined,
  data: Data[],
  exceptCategories: string[] = [],
  additionalCategories: SearchBarSuggestions = { items: [], type: [] },
): SearchBarSuggestions {
  if (
    !previousToken ||
    !previousEquation ||
    previousEquation.items.length === 0 ||
    previousToken.type.startsWith("custom") ||
    previousToken.type === "value"
  ) {
    const items: string[] = Object.keys(data[0] || {})
      .filter((item) => !exceptCategories.includes(item))
      .concat(additionalCategories.items);
    const type: string[] = Array(
      items.length - additionalCategories.items.length,
    )
      .fill("category")
      .concat(additionalCategories.type);

    items.forEach((item, index) => {
      let data_index: number = 0;
      if (data.length > 0 && item in data[0]) {
        while (
          data_index < data.length - 1 &&
          (data[data_index][item] === undefined ||
            data[data_index][item] === null)
        )
          data_index++;

        switch (typeof data[data_index][item]) {
          case "string":
            if (
              /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(
                String(data[data_index][item]),
              )
            ) {
              type[index] = "category_date";
            } else {
              type[index] = "category_string";
            }
            break;
          case "number":
            type[index] = "category_number";
            break;
          case "boolean":
            type[index] = "category_boolean";
            break;
          default:
            type[index] = "category";
        }
      }
    });
    return {
      items: items,
      type: type,
    };
  }

  if (previousToken.type === "operator_string") {
    const items = Array.from(
      new Set(
        data.map((item) =>
          String(item[previousEquation.items[0].label as keyof Data]),
        ),
      ),
    );
    return {
      items: items,
      type: Array(items.length).fill("value"),
    };
  }

  if (
    previousToken.type === "operator_date" &&
    previousToken.label === "in the last"
  ) {
    return {
      items: ["minute", "hour", "day", "week", "month", "year"],
      type: Array(6).fill("value"),
    };
  }

  let suggestions: { items: string[]; type: string[] } = {
    items: [],
    type: [],
  };
  switch (previousToken.type) {
    case "category_string":
      suggestions = {
        items: ["=", "!=", "like", "is in", "is not in"],
        type: Array(5).fill("operator_string"),
      };
      break;
    case "category_number":
      suggestions = {
        items: ["=", "!=", "<", ">", "is in", "is not in", "like"],
        type: Array(7).fill("operator_number"),
      };
      break;
    case "category_boolean":
      suggestions = {
        items: ["=", "!="],
        type: Array(2).fill("operator_bool"),
      };
      break;
    case "category_date":
      suggestions = {
        items: ["<", ">", "in the last"],
        type: Array(3).fill("operator_date"),
      };
      break;
    case "category":
      suggestions = {
        items: ["=", "!=", ">", "<", "like"],
        type: Array(5).fill("operator"),
      };
      break;
    default:
      suggestions = {
        items: [],
        type: [],
      };
  }
  return suggestions;
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
      const previousEquation = tokenEquations[focusedTokenIndex.equationIndex];
      const previousToken =
        previousEquation.items[focusedTokenIndex.tokenIndex - 1];
      return { previousEquation, previousToken };
    }
    if (
      focusedTokenIndex.equationIndex === 0 &&
      focusedTokenIndex.tokenIndex === 0
    ) {
      return { previousEquation: undefined, previousToken: undefined };
    }
    const previousEquation =
      tokenEquations[focusedTokenIndex.equationIndex - 1];
    const previousToken =
      previousEquation.items[previousEquation.items.length - 1];
    return { previousEquation, previousToken };
  }
  const lastEquation =
    tokenEquations.length > 0
      ? tokenEquations[tokenEquations.length - 1]
      : undefined;
  const lastToken = lastEquation?.items[lastEquation.items.length - 1];

  return { previousEquation: lastEquation, previousToken: lastToken };
}

/**
 * Transforms a given identifier into a human-readable format
 *
 * @param identifier The identifier to be converted
 * @returns The human-readable text
 */
export function getHumanReadableText(identifier: string | string[]): string {
  const identifierArray = Array.isArray(identifier) ? identifier : [identifier];

  // Handle snake_case: replace underscores with spaces
  // Handle kebab-case: replace hyphens with spaces
  let result = identifierArray.map((arg: string) => arg.replace(/_|-/g, " "));

  // Handle camelCase and PascalCase
  // Insert a space before an uppercase letter that follows a lowercase letter
  result = result.map((arg) => arg.replace(/([a-z])([A-Z])/g, "$1 $2"));

  // Capitalize the first letter of each word
  result = result.map((arg) => arg.replace(/\b\w/g, (c) => c.toUpperCase()));

  return convertListToString(result);
}

export function DisplayTokenEquation({
  tokensEquation,
  handleClick,
  handleRightClick,
  equationIndex,
  DynamicSearchField,
  focusedTokenIndex,
}: {
  tokensEquation: SearchBarTokenEquation;
  handleClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    tokenIndex: number,
  ) => void;
  handleRightClick: () => void;
  equationIndex: number;
  DynamicSearchField: React.ReactNode;
  focusedTokenIndex: EquationAndTokenIndex | null;
}) {
  const tokens = tokensEquation.items;

  const buttonColor =
    tokensEquation.status === "valid"
      ? "green"
      : tokensEquation.status === "invalid"
        ? "red"
        : tokensEquation.status === "waiting"
          ? "orange"
          : "grey";

  return (
    <Box>
      <ButtonGroup
        variant="outlined"
        sx={{
          "& .MuiButtonGroup-grouped": {
            borderColor: buttonColor,
          },
        }}
      >
        {tokens.map((token, tokenIndex) => {
          if (
            equationIndex === focusedTokenIndex?.equationIndex &&
            tokenIndex === focusedTokenIndex.tokenIndex
          ) {
            return DynamicSearchField;
          }
          return (
            <Button
              sx={{
                color: buttonColor,
              }}
              key={tokenIndex}
              onClick={(e) => handleClick(e, tokenIndex)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRightClick();
              }}
            >
              {getHumanReadableText(token.label)}
            </Button>
          );
        })}
      </ButtonGroup>
    </Box>
  );
}

/**
 * Returns the type of a token based on the previous token and equation.
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

export function convertFilterToTokenEquation(
  filter: InternalFilter,
  data: JobSummary[],
  exceptCategories: string[] = [],
  additionalCategories: SearchBarSuggestions,
): SearchBarTokenEquation {
  const operators = {
    eq: "=",
    neq: "!=",
    gt: ">",
    lt: "<",
    in: "is in",
    "not in": "is not in",
    like: "like",
    last: "in the last",
  };

  const newEquation: SearchBarTokenEquation = {
    items: [
      { label: filter.parameter, type: "category" },
      {
        label: operators[filter.operator as keyof typeof operators],
        type: "operator",
      },
      { label: filter.value || filter.values || "", type: "value" },
    ],
    status: "valid",
  };

  const suggestions_cat = createSuggestions(
    undefined,
    undefined,
    data,
    exceptCategories,
    additionalCategories,
  );

  newEquation.items[0].type =
    suggestions_cat.type[suggestions_cat.items.indexOf(filter.parameter)] ||
    "category";

  const suggestions_op = createSuggestions(
    newEquation.items[0],
    newEquation,
    data,
    exceptCategories,
  );

  newEquation.items[1].type =
    suggestions_op.type[
      suggestions_op.items.indexOf(
        operators[filter.operator as keyof typeof operators],
      )
    ] || "operator";

  const suggestions_value = createSuggestions(
    newEquation.items[1],
    newEquation,
    data,
    exceptCategories,
  );

  newEquation.items[1].suggestions = suggestions_op;
  newEquation.items[2].suggestions = suggestions_value;

  return newEquation;
}
