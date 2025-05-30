import jsep from "jsep";
import { removeWhiteSpace, getErrorObj } from "./utils";

const evaluateCondition = (parsedCondition, rowData) => {
  switch (parsedCondition.type) {
    case "BinaryExpression":
      return evaluateBinaryExpression(parsedCondition, rowData);
    case "Literal":
      return parsedCondition.value;
    case "Identifier":
      return rowData[parsedCondition.name];
    default:
      throw new Error(`Unsupported expression type: ${parsedCondition.type}`);
  }
};

const evaluateBinaryExpression = (expression, rowData) => {
  const left = (evaluateCondition(expression.left, rowData) || "")
    .toString()
    .toLowerCase();
  const right = (evaluateCondition(expression.right, rowData) || "")
    .toString()
    .toLowerCase();

  if (typeof right === "string" && right.includes("|")) {
    const values = right.split("|");
    switch (expression.operator) {
      case "!=":
        return !!values.includes(left);
      case "==":
        return values.includes(left);
      default:
        throw new Error(
          `Unsupported operator for multiple values: ${expression.operator}`
        );
    }
  }

  switch (expression.operator) {
    case "==":
      return left == right;
    case "===":
      return left === right;
    case "!=":
      return !(left != right);
    case "!==":
      return !(left !== right);
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "%":
      return left % right;
    default:
      throw new Error(`Unsupported operator: ${expression.operator}`);
  }
};

export const validateRowsWithConditionMapping = (
  inputData,
  conditionMap,
  headers
) => {
  const conditionMapErrors = [];
  let validRows = 0;

  const inputLength = inputData.length;

  for (let i = 0; i < inputLength; i++) {
    let hasConditionMapError = false;
    const errors = [];

    const row = inputData[i];

    conditionMapLoop: for (const conditionObj of conditionMap) {
      const { ruleNo, ruleDescription, conditions } = conditionObj;
      for (let j = 0; j < conditions.length; j++) {
        const condition = conditions[j];
        const isFirstCondition = j === 0;

        const formattedCondition = removeWhiteSpace(condition);
        for (const header of headers) {
          const formattedHeader = removeWhiteSpace(header);
          const regex = new RegExp(`\\b${formattedHeader}\\b`, "g");

          const containsHeader = regex.test(formattedCondition);

          if (containsHeader) {
            try {
              const parsedCondition = jsep(formattedCondition);
              const result = evaluateCondition(parsedCondition, row);
              if (!result && isFirstCondition) {
                continue conditionMapLoop;
              } else if (!result && !isFirstCondition) {
                hasConditionMapError = true;
                const errorObj = getErrorObj(
                  row,
                  header,
                  ruleNo,
                  ruleDescription,
                  condition
                );
                errors.push(errorObj);
                break conditionMapLoop;
              }
            } catch (error) {
              console.error(`Error evaluating condition: ${condition}`, error);
            }
          }
        }
      }
    }

    if (hasConditionMapError) {
      conditionMapErrors.push(errors);
    } else {
      validRows++;
    }
  }

  const conditionErrors = conditionMapErrors.flat(Infinity);
  return {
    validRows,
    invalidRows: conditionErrors.length,
    conditionErrors,
  };
};
