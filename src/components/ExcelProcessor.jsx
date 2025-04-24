import { useState } from "react";
import * as XLSX from "xlsx";

import FileUploader from "./FileUploader";
import Progress from "./Progress";
import Tabs from "./Tabs";
import ResetButton from "./ResetButton";

import { excelDateToDate } from "../lib/utils";
import { validateRowsWithConditionMapping } from "../lib/validateWithCondition.js";
import { validateRowsWithDataType } from "../lib/validateWithDataType";
import ErrorCard from "./ErrorCard.jsx";
import ValidationCard from "./ValidationCard.jsx";

function ExcelProcessor() {
  const [inputFile, setInputFile] = useState({ name: "", data: null });
  const [rulesFile, setRulesFile] = useState({ name: "", data: null });
  const [processedFile, setProcessedFile] = useState(null);
  const [validationStatus, setValidationStatus] = useState("idle");
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    subSheet1Count: 0,
    subSheet2Count: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");

  //to handle input and rules file upload
  const handleFileUpload = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        if (type === "input") {
          setInputFile({ name: file.name, data: workbook });
        } else {
          const sheetNames = workbook.SheetNames;
          if (
            (sheetNames.length === 2 &&
              sheetNames.includes("DataMap") &&
              sheetNames.includes("ConditionRule")) ||
            (sheetNames.length === 1 &&
              (sheetNames.includes("DataMap") ||
                sheetNames.includes("ConditionRule")))
          ) {
            setRulesFile({ name: file.name, data: workbook });
            setErrorMessage("");
          } else {
            setValidationStatus("error");
            const error =
              "Required sheet names 'DataMap' for datatype and 'ConditionRule' for condition are missing in rules file";
            setErrorMessage(error);
            throw new Error(error);
          }
        }
      } catch (error) {
        console.error(`Error reading ${type} file:`, error);
        if (type === "input") {
          setInputFile({ name: file.name, data: null });
        } else {
          setRulesFile({ name: file.name, data: null });
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndProcess = () => {
    setValidationStatus("validating");
    setValidationProgress(0);

    // Simulate processing with a timeout to show progress
    const totalSteps = 100;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep += 1;
      setValidationProgress(Math.min((currentStep / totalSteps) * 100, 99));

      if (currentStep >= totalSteps) {
        clearInterval(progressInterval);
      }
    }, 30);

    // Process the files
    setTimeout(() => {
      try {
        // Get the sheets from input file
        const inputSheet = inputFile.data.Sheets[inputFile.data.SheetNames[0]];

        // Get the map and rules sheets from rules file
        const mapSheet = rulesFile.data.Sheets["DataMap"];
        const rulesSheet = rulesFile.data.Sheets["ConditionRule"];
        // Convert sheets to JSON
        const inputData = XLSX.utils.sheet_to_json(inputSheet, { header: 1 });
        const mapData = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
        const rulesData = XLSX.utils.sheet_to_json(rulesSheet, { header: 1 });

        // Extract headers
        const headers = inputData[0].map((header) =>
          header?.toString().trim().toLowerCase().split(" ").join("")
        );

        const formattedInputData = inputData.slice(1).map((row) => {
          let obj = {};
          headers.forEach((header, index) => {
            if (header.includes("date") && row[index] !== undefined) {
              const serialDate = row[index];
              const convertedDate = excelDateToDate(serialDate);
              obj[header] = convertedDate;
            } else {
              obj[header] = row[index] || null;
            }
          });
          return obj;
        });
        // Parse data type map
        const dataTypeMap = parseDataTypeMap(mapData);
        // Parse rules
        const conditions = parseRules(rulesData);

        // Validate row with data type
        const validationRowResultWithDataType = validateRowsWithDataType(
          formattedInputData,
          dataTypeMap
        );

        // validate row with condition mapping
        const validationResultWithConditionMapping =
          validateRowsWithConditionMapping(
            formattedInputData,
            conditions,
            headers
          );
        // Update validation results
        const combinedResults = {
          totalRows: inputData.length - 1, // Exclude header row
          validRows: validationRowResultWithDataType.validRows,
          invalidRows:
            validationRowResultWithDataType.invalidRows +
            validationResultWithConditionMapping.invalidRows,
          subSheet1Count: validationRowResultWithDataType.typeErrors.length,
          subSheet2Count:
            validationResultWithConditionMapping.conditionErrors.length,
          errors: [
            ...validationRowResultWithDataType.typeErrors,
            ...validationResultWithConditionMapping.conditionErrors,
          ],
        };

        setValidationResults(combinedResults);

        // Create processed workbook
        const processedWorkbook = createProcessedWorkbook(
          inputData,
          validationRowResultWithDataType.typeErrors,
          validationResultWithConditionMapping.conditionErrors
        );
        setProcessedFile(processedWorkbook);
        setValidationStatus("success");
        setValidationProgress(100);
      } catch (error) {
        console.error("Error processing files:", error);
        setValidationStatus("error");
        setValidationProgress(100);
      }
    }, 3000);
  };

  // Parse the data type map from the Map sheet
  const parseDataTypeMap = (mapData) => {
    const dataTypeMap = {};

    // Skip header row
    for (let i = 1; i < mapData.length; i++) {
      const row = mapData[i];
      if (row.length >= 2) {
        const columnName = row[0];
        const dataType = row[1];
        dataTypeMap[columnName] = dataType;
      }
    }

    return dataTypeMap;
  };

  // Parse rules from the Rules sheet
  const parseRules = (rulesData) => {
    const conditions = [];

    // Skip header row
    for (let i = 1; i < rulesData.length; i++) {
      const row = rulesData[i];
      if (row.length >= 3) {
        const ruleNo = row["Rule No"] || row[0];
        const ruleDescription = row["Rule Description"] || row[1];
        // Get all conditions (may be in columns 2, 3, 4, etc.)
        const ruleConditions = row.slice(2).filter(Boolean); // Only add non-empty conditions

        conditions.push({
          ruleNo,
          ruleDescription,
          conditions: ruleConditions,
        });
      }
    }

    return conditions;
  };

  // Create the processed workbook with original data and error sheets
  const createProcessedWorkbook = (inputData, typeErrors, conditionErrors) => {
    const workbook = XLSX.utils.book_new();

    // Add original data
    const originalSheet = XLSX.utils.aoa_to_sheet(inputData);
    XLSX.utils.book_append_sheet(workbook, originalSheet, "Original");

    // Add data type errors sheet
    if (typeErrors.length > 0) {
      const dataTypeErrorsSheet = XLSX.utils.json_to_sheet(typeErrors);
      XLSX.utils.book_append_sheet(
        workbook,
        dataTypeErrorsSheet,
        "DataTypeErrors"
      );
    }

    // Add condition errors sheet
    if (conditionErrors.length > 0) {
      const conditionErrorsSheet = XLSX.utils.json_to_sheet(conditionErrors);
      XLSX.utils.book_append_sheet(
        workbook,
        conditionErrorsSheet,
        "ConditionErrors"
      );
    }

    return workbook;
  };

  const downloadProcessedFile = () => {
    if (!processedFile) return;

    XLSX.writeFile(processedFile, "processed_" + inputFile.name);
  };

  const resetProcess = () => {
    setInputFile({ name: "", data: null });
    setRulesFile({ name: "", data: null });
    setProcessedFile(null);
    setValidationStatus("idle");
    setValidationProgress(0);
    setValidationResults({
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      subSheet1Count: 0,
      subSheet2Count: 0,
    });
    setErrorMessage("");
  };

  const canValidate =
    inputFile.data && rulesFile.data && validationStatus !== "validating";
  const isProcessing = validationStatus === "validating";
  const isComplete = validationStatus === "success";
  const hasError = validationStatus === "error";

  return (
    <div
      className="excel-processor"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      <div className="card">
        <div className="grid grid-cols-2">
          <FileUploader
            label="Upload Billing - Charges Report"
            accept=".xlsx,.xls"
            onFileUpload={(file) => handleFileUpload(file, "input")}
            fileName={inputFile.name}
            disabled={isProcessing}
          />
          <FileUploader
            label="Upload Rules Excel File"
            accept=".xlsx,.xls"
            onFileUpload={(file) => handleFileUpload(file, "rules")}
            fileName={rulesFile.name}
            disabled={isProcessing}
          />
        </div>

        <div className="mt-4 flex-col">
          <button
            className="button w-full"
            onClick={validateAndProcess}
            disabled={!canValidate}
          >
            {isProcessing ? "Processing..." : "Validate and Process"}
          </button>
          <ResetButton resetProcess={resetProcess} disabled={isProcessing} />
        </div>

        {isProcessing && (
          <div className="mt-4">
            <Progress value={validationProgress} />
            <p
              style={{
                textAlign: "center",
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "8px",
              }}
            >
              Processing files... {Math.round(validationProgress)}%
            </p>
          </div>
        )}

        {hasError && <ErrorCard errorMessage={errorMessage} />}
      </div>

      {isComplete && (
        <div>
          <div>
            <ValidationCard validationResults={validationResults} />
            <Tabs
              tabs={[
                {
                  id: "subSheet1",
                  label: `SubSheet 1 (${validationResults.subSheet1Count} rows)`,
                },
                {
                  id: "subSheet2",
                  label: `SubSheet 2 (${validationResults.subSheet2Count} rows)`,
                },
              ]}
              defaultTab="subSheet1"
              content={{
                subSheet1: (
                  <div className="tab-content">
                    <p style={{ fontSize: "0.875rem", color: "#666" }}>
                      This subSheet contains rows where the condition is not
                      true.
                    </p>
                    <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                      {validationResults.subSheet1Count} rows have been added to
                      SubSheet 1.
                    </p>
                  </div>
                ),
                subSheet2: (
                  <div className="tab-content">
                    <p style={{ fontSize: "0.875rem", color: "#666" }}>
                      This subSheet contains rows where the condition is not
                      true.
                    </p>
                    <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                      {validationResults.subSheet2Count} rows have been added to
                      SubSheet 2.
                    </p>
                  </div>
                ),
              }}
            />

            <div className="flex justify-between mt-4">
              <ResetButton resetProcess={resetProcess} />
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
                  <path
                    d="M12 15V3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download Processed File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelProcessor;
