import * as XLSX from "xlsx"

export default function ValidationEngine({ 
    inputFile,
    rulesFile,
    setValidationStatus,
    setValidationProgress,
    setValidationResults,
    setProcessedFile,
 }) {


  console.log('Inside validation engine',
    inputFile,
    rulesFile,
    setValidationStatus,
    setValidationProgress,
    setValidationResults,
    setProcessedFile,
  );

  const validateData = () => {
    setValidationStatus("validating")
    setValidationProgress(0)

    // Simulate processing with a timeout to show progress
    const totalSteps = 100
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep += 1
      setValidationProgress(Math.min((currentStep / totalSteps) * 100, 99))

      if (currentStep >= totalSteps) {
        clearInterval(progressInterval)
      }
    }, 30)

    // Process the files
    setTimeout(() => {
      try {
        // Get the sheets from input file
        const inputSheet = inputFile.data.Sheets[inputFile.data.SheetNames[0]]

        // Get the map and rules sheets from rules file
        const mapSheet = rulesFile.data.Sheets[rulesFile.data.SheetNames[0]] // First sheet is Map
        const rulesSheet = rulesFile.data.Sheets[rulesFile.data.SheetNames[1]] // Second sheet is Rules

        // Convert sheets to JSON
        const inputData = XLSX.utils.sheet_to_json(inputSheet, { header: 1 })
        const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 })
        const rulesData = XLSX.utils.sheet_to_json(rulesSheet, { header: 1 })

        // Extract headers
        const headers = inputData[0]

        // Parse data type map
        const dataTypeMap = parseDataTypeMap(mapData, headers)

        // Parse rules
        const conditions = parseRules(rulesData)

        // Validate data types and rules
        const validationResult = validateRows(inputData, dataTypeMap, conditions)

        // Update validation results
        setValidationResults({
          totalRows: inputData.length - 1, // Exclude header row
          validRows: validationResult.validRows,
          invalidRows: validationResult.invalidRows,
          subsheet1Rows: validationResult.dataTypeErrors,
          subsheet2Rows: validationResult.conditionErrors,
          errors: validationResult.errors,
        })

        // Create processed workbook
        const processedWorkbook = createProcessedWorkbook(
          inputData,
          validationResult.dataTypeErrors,
          validationResult.conditionErrors,
          headers,
        )

        setValidationStatus("success")
        setValidationProgress(100)

        setProcessedFile(processedWorkbook);
      } catch (error) {
        console.error("Error processing files:", error)
        setValidationStatus("error")
        setValidationProgress(100)
      }
    }, 3000)
  }

  return validateData;

  // Parse the data type map from the Map sheet
  const parseDataTypeMap = (mapData, headers) => {
    const dataTypeMap = {}

    // Skip header row
    for (let i = 1; i < mapData.length; i++) {
      const row = mapData[i]
      if (row.length >= 2) {
        const columnName = row[0]
        const dataType = row[1]
        dataTypeMap[columnName] = dataType
      }
    }

    return dataTypeMap
  }

  // Parse rules from the Rules sheet
  const parseRules = (rulesData) => {
    const conditions = []

    // Skip header row
    for (let i = 1; i < rulesData.length; i++) {
      const row = rulesData[i]
      if (row.length >= 3) {
        const ruleNo = row[0]
        const ruleDescription = row[1]
        // Get all conditions (may be in columns 2, 3, 4, etc.)
        const ruleConditions = row.slice(2).filter(Boolean) // Only add non-empty conditions

        conditions.push({
          ruleNo,
          ruleDescription,
          conditions: ruleConditions,
        })
      }
    }

    return conditions
  }

  // Validate data types and conditions for all rows
  const validateRows = (inputData, dataTypeMap, conditions) => {
    const headers = inputData[0]
    const dataTypeErrors = []
    const conditionErrors = []
    const errors = []
    let validRows = 0

    // Start from row 1 (skip header)
    for (let i = 1; i < inputData.length; i++) {
      const row = inputData[i]
      let hasDataTypeError = false
      let hasConditionError = false

      // Check data types
      for (let j = 0; j < headers.length; j++) {
        const columnName = headers[j]
        const cellValue = row[j]
        const expectedType = dataTypeMap[columnName]

        if (expectedType && !validateDataType(cellValue, expectedType)) {
          hasDataTypeError = true
          errors.push({
            row: i,
            column: columnName,
            value: cellValue,
            error: `Expected ${expectedType}, got ${typeof cellValue}`,
          })
        }
      }

      // Check conditions
      for (const { ruleNo, ruleDescription, conditions: ruleConditions } of conditions) {
        let ruleFailed = false

        for (const condition of ruleConditions) {
          const expression = condition.replace(/\b\w+\b/g, (match) => {
            const index = headers.indexOf(match)
            return index !== -1 ? JSON.stringify(row[index]) : match
          })

          if (!evaluateCondition(expression)) {
            ruleFailed = true
            errors.push({
              row: i,
              rule: ruleNo,
              description: ruleDescription,
              condition: condition,
              error: `Condition failed: ${condition}`,
            })
            break
          }
        }

        if (ruleFailed) {
          hasConditionError = true
          break
        }
      }

      // Add row to appropriate result set
      if (hasDataTypeError) {
        dataTypeErrors.push(row)
      }

      if (hasConditionError) {
        conditionErrors.push(row)
      }

      if (!hasDataTypeError && !hasConditionError) {
        validRows++
      }
    }

    return {
      validRows,
      invalidRows: dataTypeErrors.length + conditionErrors.length,
      dataTypeErrors,
      conditionErrors,
      errors,
    }
  }

  // Validate a cell value against an expected data type
  const validateDataType = (value, expectedType) => {
    switch (expectedType.toLowerCase()) {
      case "string":
        return typeof value === "string"
      case "number":
        return typeof value === "number" || !isNaN(Number(value))
      case "boolean":
        return typeof value === "boolean" || value === "true" || value === "false"
      case "date":
        return !isNaN(Date.parse(value))
      default:
        return true // If type is unknown, consider it valid
    }
  }

  // Evaluate a condition expression
  const evaluateCondition = (expression) => {
    try {
      return Function('"use strict"; return (' + expression + ")")()
    } catch (e) {
      console.error("Error evaluating condition:", expression, e)
      return false // Return false if condition fails to evaluate
    }
  }

  // Create the processed workbook with original data and error sheets
  const createProcessedWorkbook = (inputData, dataTypeErrors, conditionErrors, headers) => {
    const workbook = XLSX.utils.book_new()

    // Add original data
    const originalSheet = XLSX.utils.aoa_to_sheet(inputData)
    XLSX.utils.book_append_sheet(workbook, originalSheet, "Original")

    // Add data type errors sheet
    if (dataTypeErrors.length > 0) {
      const dataTypeErrorsWithHeader = [headers, ...dataTypeErrors]
      const dataTypeErrorsSheet = XLSX.utils.aoa_to_sheet(dataTypeErrorsWithHeader)
      XLSX.utils.book_append_sheet(workbook, dataTypeErrorsSheet, "DataTypeErrors")
    }

    // Add condition errors sheet
    if (conditionErrors.length > 0) {
      const conditionErrorsWithHeader = [headers, ...conditionErrors]
      const conditionErrorsSheet = XLSX.utils.aoa_to_sheet(conditionErrorsWithHeader)
      XLSX.utils.book_append_sheet(workbook, conditionErrorsSheet, "ConditionErrors")
    }

    return workbook
  }
}

