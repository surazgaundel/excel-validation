//function to change the millisecond date value to normal date format.
export function excelDateToDate(serial) {
  const baseDate = new Date(1899, 11, 30); // December 30, 1899
  const msInADay = 86400000; // milliseconds in a day
  const date = new Date(baseDate.getTime() + serial * msInADay);
  return date;
}

//test the condition of the data value could be only number and Alphanumeric
export const dataTypeRegex = /^[a-zA-Z0-9]*\.?[0-9]+$|^[0-9]*\.?[0-9]+$/;