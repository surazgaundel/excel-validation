//function to change the millisecond date value to normal date format.
export function excelDateToDate(serial) {
  const baseDate = new Date(1899, 11, 30); // December 30, 1899
  const msInADay = 86400000; // milliseconds in a day
  const date = new Date(baseDate.getTime() + serial * msInADay);
  return date;
}

//test the condition of the data value could be only number and Alphanumeric
export const dataTypeRegex = /^[a-zA-Z0-9]*\.?[0-9]+$|^[0-9]*\.?[0-9]+$/;

export const removeWhiteSpace=(string)=> string.toLowerCase().replace(/\s+/g, '');

export const removeWhitespaceFromKeys = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
      const newKey = removeWhiteSpace(key);
      acc[newKey] = obj[key];
      return acc;
  }, {});
};


export function getErrorObj(input,header,ruleNo,ruleDescription,condition){
  const errorObj = {
    claimNumber: input['claimno'],
    Value: input[header],
    Rule: `Rule: ${ruleNo}, ${ruleDescription}`,
    Error: `Error evaluating condition: ${condition}`
  };

  return errorObj;
}
