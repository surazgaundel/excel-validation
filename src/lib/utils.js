import jsep from "jsep";

//function to change the millisecond date value to normal date format.
export function excelDateToDate(serial) {
  const baseDate = new Date(1899, 11, 30); // December 30, 1899
  const msInADay = 86400000; // milliseconds in a day
  const date = new Date(baseDate.getTime() + serial * msInADay);
  return date;
}

//test the condition of the data value could be only number and Alphanumeric
export const dataTypeRegex = /^[a-zA-Z0-9]*\.?[0-9]+$|^[0-9]*\.?[0-9]+$/;

const removeWhitespaceFromKeys = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
      const newKey = removeWhiteSpace(key);
      acc[newKey] = obj[key];
      return acc;
  }, {});
};

// Validate data types and conditions for all rows 
export  const validateRowsWithDataType = (inputData, dataTypeMap) => {
  const formattedDataTypeMap = removeWhitespaceFromKeys(dataTypeMap);
  const dataTypeErrors = []
  let validRows = 0;
  
  const inputLength = inputData.length;
  for (let i = 0; i < inputLength; i++) {
    let hasDataTypeError = false
    const errors = []

    // Check data types
    for(const key in formattedDataTypeMap){
      const expectedType = formattedDataTypeMap[key].toLowerCase();
      const actualValue = inputData[i][key];
      let actualType = typeof actualValue;
      if (actualType === 'string' && expectedType === 'text') {
        actualType = 'text';
      } else if (actualType === 'number' && expectedType === 'number') {
        actualType = 'number';
      }  else if (actualValue === null || actualValue === undefined) {
        actualType = 'null';
      } else if ((actualType === 'string' || actualType === 'number') && dataTypeRegex.test(actualValue)) {
          actualType = 'general';
      } else if (expectedType === 'date' && actualValue instanceof Date) {
        actualType = 'date';
      }  else if (actualType === 'number' && expectedType === 'amount') {
        actualType = 'amount';
      } else if (expectedType !== actualType && actualValue !== null) {
          hasDataTypeError=true;
          const errorObj={
            claimNumber: inputData[i]['claimno'],
            Header:key,
            Value: actualValue,
            Error: `Expected ${expectedType}, got ${actualType}`
          }
          errors.push(errorObj);
        }
    }

    if (hasDataTypeError) {
      dataTypeErrors.push(errors)
    } else {
      validRows++;
    }
  }
  const typeErrors = dataTypeErrors.flat(Infinity);

  return {
    validRows,
    invalidRows: typeErrors.length,
    typeErrors
  }
}

const evaluateCondition = (parsedCondition, rowData) => {
  switch (parsedCondition.type) {
    case 'BinaryExpression':
      return evaluateBinaryExpression(parsedCondition, rowData);
    case 'Literal':
      return parsedCondition.value;
    case 'Identifier':
      return rowData[parsedCondition.name];
    default:
      throw new Error(`Unsupported expression type: ${parsedCondition.type}`);
  }
};

const evaluateBinaryExpression = (expression, rowData) => {
  const left = evaluateCondition(expression.left, rowData);
  const right = evaluateCondition(expression.right, rowData);
  
  if (typeof right === 'string' && right.includes('|')) {
    const values = right.split('|');
    switch (expression.operator) {
      case '!=':
        return !values.includes(left);
      case '==':
        return values.includes(left);
      default:
        throw new Error(`Unsupported operator for multiple values: ${expression.operator}`);
    }
  }

  switch (expression.operator) {
    case '==':
      return !(left == right);
    case '===':
      return !(left === right);
    case '!=':
      return !(left != right);
    case '!==':
      return !(left !== right);
    case '<':
      return !(left < right);
    case '<=':
      return !(left <= right);
    case '>':
      return !(left > right);
    case '>=':
      return !(left >= right);
    case '+':
      return !(left + right);
    case '-':
      return !(left - right);
    case '*':
      return !(left * right);
    case '/':
      return !(left / right);
    case '%':
      return !(left % right);
    default:
      throw new Error(`Unsupported operator: ${expression.operator}`);
  }
};

const removeWhiteSpace=(string)=> string.toLowerCase().replace(/\s+/g, '');

function getErrorObj(input,header,ruleNo,ruleDescription,condition){
  const errorObj = {
    claimNumber: input['claimno'],
    Value: input[header],
    Rule: `Rule: ${ruleNo}, ${ruleDescription}`,
    Error: `Error evaluating condition: ${condition}`
  };

  return errorObj;
}

export const validateRowsWithConditionMapping = (inputData, conditionMap, headers) => {
  const conditionMapErrors = [];
  let validRows = 0;

  const inputLength = inputData.length;

  for (let i = 0; i < inputLength; i++) {
    let hasConditionMapError = false;
    const errors = [];

    const row = inputData[i];

    for (const conditionObj of conditionMap) {
      const { ruleNo, ruleDescription, conditions } = conditionObj;
      for (const condition of conditions) {
        const formattedCondition = removeWhiteSpace(condition);
        for (const header of headers) {
          const formattedHeader = removeWhiteSpace(header);
          const regex = new RegExp(`\\b${formattedHeader}\\b`, 'g');

          const containsHeader = regex.test(formattedCondition);

          if (containsHeader) {
            try {
              const parsedCondition = jsep(formattedCondition);
              const result = evaluateCondition(parsedCondition, row);

              if (!result) {
                hasConditionMapError = true;
                const errorObj= getErrorObj(row,header,ruleNo,ruleDescription,condition);
                errors.push(errorObj);
                continue; // stop checking more conditions, go to next row
              }

              break; // Condition passed, move to next condition
            } catch (error) {
              console.error(`Error evaluating condition: ${condition}`, error);
              hasConditionMapError = true;
              const errorObj= getErrorObj(row,header,ruleNo,ruleDescription,condition);
              errors.push(errorObj);
              continue; // stop checking more conditions, go to next row
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
    conditionErrors
  };
};
