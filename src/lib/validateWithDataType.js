import { removeWhitespaceFromKeys, dataTypeRegex } from "./utils";

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