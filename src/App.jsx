import ExcelProcessor from "./components/ExcelProcessor";
import "./App.css"

function App() {
  return (
    <div className="container">
      <header className="app-header">
        <h1>Excel File Validator</h1>
        <p className="description">Upload your input Excel file and rules file to validate and process the data</p>
      </header>
      <main>
        <ExcelProcessor />
      </main>
    </div>
  )
}

export default App

