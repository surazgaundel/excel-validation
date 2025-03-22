import { useState } from "react";
import * as XLSX from "xlsx"
import FileUploader from "./FileUploader";
import Progress from "./Progress";
import Tabs from "./Tabs";
import { dataTypeRegex, excelDateToDate } from "../lib/utils";
// import ValidationEngine from "./ValidationEngine";

function ExcelProcessor() {
  const [inputFile, setInputFile] = useState({ name: "", data: null })
  const [rulesFile, setRulesFile] = useState({ name: "", data: null })
  const [processedFile, setProcessedFile] = useState(null)
  const [validationStatus, setValidationStatus] = useState("idle")
  const [validationProgress, setValidationProgress] = useState(0)
  const [validationResults, setValidationResults] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    subSheet1Count: 0,
    subSheet2Count: 0,
  })

  //to handle input and rules file upload
  const handleFileUpload = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        if(type === 'input'){
        setInputFile({ name: file.name, data: workbook })
        } else{
          setRulesFile({ name: file.name, data: workbook })
        }
      } catch (error) {
        console.error(`Error reading ${type} file:`, error);
        if(type === 'input'){
          setInputFile({ name: file.name, data: null })
        } else{
          setRulesFile({ name: file.name, data: null })
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // const validateData = ValidationEngine({
  //   inputFile,
  //   rulesFile,
  //   setValidationStatus,
  //   setValidationProgress,
  //   setValidationResults,
  //   setProcessedFile,
  // });



    const validateAndProcess = () => {
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
          const mapSheet = rulesFile.data.Sheets[rulesFile.data.SheetNames[0]];
          const rulesSheet = rulesFile.data.Sheets[rulesFile.data.SheetNames[1]];
  
          // Convert sheets to JSON
          const inputData = XLSX.utils.sheet_to_json(inputSheet, { header: 1 })
          const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 })
          const rulesData = XLSX.utils.sheet_to_json(rulesSheet, { header: 1 })
          
          // Extract headers
          const headers = inputData[0].map(header => header?.toString().trim());

          const formattedInputData = inputData.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, index) => {
              if(header.includes('Date') && row[index] !== undefined){
                const serialDate= row[index];
                const convertedDate= excelDateToDate(serialDate);
                obj[header] = convertedDate;
              }else{
                obj[header] = row[index] || null;
              }
            });
            return obj;
        });
          console.log("🚀 ~ formattedInputData ~ formattedInputData:", formattedInputData)
          // Parse data type map
          const dataTypeMap = parseDataTypeMap(mapData);
          // Parse rules
          const conditions = parseRules(rulesData)
  
          // Validate data types and rules
          const validationResult = validateRows(formattedInputData, dataTypeMap)
  
          // Update validation results
          setValidationResults({
            totalRows: inputData.length - 1, // Exclude header row
            validRows: validationResult.validRows,
            invalidRows: validationResult.invalidRows,
            subSheet1Rows: validationResult.dataTypeErrors,
            subSheet2Rows: validationResult.conditionErrors,
            errors: validationResult.errors,
          })
  
          // Create processed workbook
          const processedWorkbook = createProcessedWorkbook(
            inputData,
            validationResult.dataTypeErrors,
            validationResult.conditionErrors,
            headers,
          )
          setProcessedFile(processedWorkbook);
          setValidationStatus("success")
          setValidationProgress(100)
  
        } catch (error) {
          console.error("Error processing files:", error)
          setValidationStatus("error")
          setValidationProgress(100)
        }
      }, 1000)
    }
  
    // Parse the data type map from the Map sheet
    const parseDataTypeMap = (mapData) => {
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
  
      return dataTypeMap;
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
    const validateRows = (inputData, dataTypeMap) => {
      const dataTypeErrors = []
      // const conditionErrors = []
      const errors = []
      let validRows = 0;
  
      // Start from row 1 (skip header)
      const inputLength = inputData.length;
      for (let i = 0; i < inputLength; i++) {
        let hasDataTypeError = false
        // let hasConditionError = false
  
        // Check data types
        for(const key in dataTypeMap){
          const expectedType = dataTypeMap[key].toLowerCase();
          const actualValue = inputData[i][key];
          let actualType = typeof actualValue;

          if (actualType === 'string' && expectedType === 'text') actualType = 'text';
            else if (actualType === 'number' && expectedType === 'number') actualType = 'number';
            else if (actualValue === null || actualValue === undefined) actualType = 'null';
            else if ((actualType === 'string' || actualType === 'number') 
              && dataTypeRegex.test(actualValue)) actualType = 'general';
            else if (expectedType === 'date' && actualValue instanceof Date) actualType = 'date';
            
            if (expectedType !== actualType && actualValue !== null) {
                errors.push({
                    claimNumber: inputData[i]['Claim No'],
                    column:key,
                    value: actualValue,
                    error: `Expected ${expectedType}, got ${actualType}`
                });
            }

        }
        console.log('Er',errors);

        // Check conditions
  
        // Add row to appropriate result set
        if (hasDataTypeError) {
          dataTypeErrors.push(errors)
        }
  
        // if (hasConditionError) {
        //   conditionErrors.push(row)
        // }
  
        // if (!hasDataTypeError && !hasConditionError) {
        //   validRows++
        // }
      }
  
      return {
        validRows,
        invalidRows: dataTypeErrors.length,
        dataTypeErrors,
        // conditionErrors,
        errors,
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

  const downloadProcessedFile = () => {
    if (!processedFile) return

    XLSX.writeFile(processedFile, "processed_" + inputFile.name)
  }

  const resetProcess = () => {
    setInputFile({ name: "", data: null })
    setRulesFile({ name: "", data: null })
    setProcessedFile(null)
    setValidationStatus("idle")
    setValidationProgress(0)
  }

  const canValidate = inputFile.data && rulesFile.data && validationStatus !== "validating"
  const isProcessing = validationStatus === "validating"
  const isComplete = validationStatus === "success"
  const hasError = validationStatus === "error"

  return (
    <div className="excel-processor" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="card">
        <div className="grid grid-cols-2">
          <FileUploader
            label="Upload Input Excel File"
            accept=".xlsx,.xls"
            onFileUpload={(file)=>handleFileUpload(file,'input')}
            fileName={inputFile.name}
            disabled={isProcessing}
          />
          <FileUploader
            label="Upload Rules Excel File"
            accept=".xlsx,.xls"
            onFileUpload={(file)=>handleFileUpload(file,'rules')}
            fileName={rulesFile.name}
            disabled={isProcessing}
          />
        </div>

        <div className="mt-4">
          <button className="button w-full" onClick={validateAndProcess} disabled={!canValidate}>
            {isProcessing ? "Processing..." : "Validate and Process"}
          </button>
        </div>

        {isProcessing && (
          <div className="mt-4">
            <Progress value={validationProgress} />
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#666", marginTop: "8px" }}>
              Processing files... {Math.round(validationProgress)}%
            </p>
          </div>
        )}

        {hasError && (
          <div className="alert alert-error mt-4">
            <svg
              className="alert-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
              <path d="M12 8V12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#EF4444" />
            </svg>
            <div>
              <div className="alert-title">Error</div>
              <p>There was an error processing your files. Please check the file formats and try again.</p>
            </div>
          </div>
        )}
      </div>

      {isComplete && (
        <div>
          <div className="alert alert-success">
            <svg
              className="alert-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="#22C55E" strokeWidth="2" />
              <path
                d="M8 12L11 15L16 9"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <div className="alert-title">Validation Complete</div>
              <p>Your files have been processed successfully.</p>
            </div>
          </div>

          <div className="card mt-4">
            <h3 style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "16px" }}>Validation Results</h3>

            <div className="stats-grid">
              <div className="stats-card stats-card-total">
                <p>Total Rows</p>
                <p>{validationResults.totalRows}</p>
              </div>
              <div className="stats-card stats-card-valid">
                <p style={{ color: "#16A34A" }}>Valid Rows</p>
                <p style={{ color: "#15803D" }}>{validationResults.validRows}</p>
              </div>
              <div className="stats-card stats-card-invalid">
                <p style={{ color: "#EA580C" }}>Invalid Rows</p>
                <p style={{ color: "#C2410C" }}>{validationResults.invalidRows}</p>
              </div>
            </div>

            <Tabs
              tabs={[
                { id: "subSheet1", label: `SubSheet 1 (${validationResults.subSheet1Count} rows)` },
                { id: "subSheet2", label: `SubSheet 2 (${validationResults.subSheet2Count} rows)` },
              ]}
              defaultTab="subSheet1"
              content={{
                subSheet1: (
                  <div className="tab-content">
                    <p style={{ fontSize: "0.875rem", color: "#666" }}>
                      This subSheet contains rows where the condition is not true.
                    </p>
                    <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                      {validationResults.subSheet1Count} rows have been added to SubSheet 1.
                    </p>
                  </div>
                ),
                subSheet2: (
                  <div className="tab-content">
                    <p style={{ fontSize: "0.875rem", color: "#666" }}>
                      This subSheet contains rows where the condition is not true.
                    </p>
                    <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                      {validationResults.subSheet2Count} rows have been added to SubSheet 2.
                    </p>
                  </div>
                ),
              }}
            />

            <div className="flex justify-between mt-4">
              <button className="button button-outline" onClick={resetProcess}>
                <svg
                  style={{ marginRight: "8px", width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 12L8 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 9L16 12L13 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Start Over
              </button>
              <button className="button" onClick={downloadProcessedFile}>
                <svg
                  style={{ marginRight: "8px", width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Processed File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelProcessor;

