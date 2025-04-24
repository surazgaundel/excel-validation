import ExcelProcessor from "./components/ExcelProcessor";
import "./App.css";

function App() {
  return (
    <div className="container">
      <header className="app-header">
        <h1>Billing - Auto Reconciliation Tool</h1>
        <p className="description">
          Upload Billing Charges Report & Rules files to validate the prepared
          claims
        </p>
      </header>
      <main>
        <ExcelProcessor />
      </main>
    </div>
  );
}

export default App;
