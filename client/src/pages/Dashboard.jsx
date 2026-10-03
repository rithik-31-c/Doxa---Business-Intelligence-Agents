import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MetricCard from "../components/MetricCard";

import {
  investigateShop,
  uploadShopCsv
} from "../services/api";


// ============================================================
// HELPERS
// ============================================================

const parseAnalysis = (analysis) => {
  if (!analysis) {
    return null;
  }

  if (typeof analysis === "object") {
    return analysis;
  }

  try {
    return JSON.parse(analysis);
  } catch (error) {
    console.error(
      "Failed to parse AI analysis:",
      error
    );

    return null;
  }
};


const getDisplayText = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value && typeof value === "object") {
    return (
      value.data ||
      value.description ||
      value.title ||
      value.cause ||
      JSON.stringify(value)
    );
  }

  return "";
};


const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString();
};


// ============================================================
// UPLOAD PROCESS STEPS
// ============================================================

const uploadSteps = [
  {
    id: 1,
    label: "Upload"
  },
  {
    id: 2,
    label: "Profile"
  },
  {
    id: 3,
    label: "Understand"
  },
  {
    id: 4,
    label: "Prepare"
  },
  {
    id: 5,
    label: "Ready"
  }
];


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

  const [question, setQuestion] = useState(
    "Why are my sales decreasing?"
  );

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [dataset, setDataset] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [uploadStage, setUploadStage] =
    useState("");


  // ==========================================================
  // INVESTIGATION
  // ==========================================================

  const handleInvestigation = async () => {

    if (!question.trim()) {
      return;
    }

    if (!dataset) {
      setError(
        "Please upload a CSV dataset before starting an investigation."
      );

      return;
    }

    try {

      setLoading(true);

      setError("");

      const response =
        await investigateShop(
          question
        );

      setResult(
        response.data
      );

    } catch (err) {

      console.error(
        "Investigation error:",
        err
      );

      setError(
        err.message ||
        "Unable to investigate the dataset. Please make sure the backend is running."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // CSV UPLOAD
  // ==========================================================

  const handleCsvUpload = async (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // Reset previous state

    setUploadError("");

    setError("");

    setResult(null);

    setDataset(null);

    setUploadedFile(null);


    try {

      setUploading(true);


      // ------------------------------------------------------
      // STEP 1 — UPLOAD
      // ------------------------------------------------------

      setUploadProgress(10);

      setUploadStage(
        "Uploading your CSV..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            350
          )
      );


      // ------------------------------------------------------
      // STEP 2 — PROFILE
      // ------------------------------------------------------

      setUploadProgress(25);

      setUploadStage(
        "Reading dataset structure..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            350
          )
      );


      // ------------------------------------------------------
      // STEP 3 — UNDERSTAND
      // ------------------------------------------------------

      setUploadProgress(45);

      setUploadStage(
        "Profiling rows and columns..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            350
          )
      );


      setUploadProgress(60);

      setUploadStage(
        "Understanding your data..."
      );


      // ------------------------------------------------------
      // ACTUAL BACKEND PROCESSING
      // ------------------------------------------------------

      const response =
        await uploadShopCsv(
          file
        );


      // ------------------------------------------------------
      // STEP 4 — PREPARE
      // ------------------------------------------------------

      setUploadProgress(82);

      setUploadStage(
        "Preparing DOXA investigation..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            450
          )
      );


      // ------------------------------------------------------
      // STORE DATASET
      // ------------------------------------------------------

      setUploadedFile(file);

      setDataset(
        response.dataset
      );


      // ------------------------------------------------------
      // STEP 5 — COMPLETE
      // ------------------------------------------------------

      setUploadProgress(100);

      setUploadStage(
        "Dataset ready"
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700
          )
      );


    } catch (error) {

      console.error(
        "CSV upload error:",
        error
      );

      setUploadError(
        error.message ||
        "Failed to upload CSV."
      );

      setUploadProgress(0);

      setUploadStage("");

    } finally {

      setUploading(false);

      setTimeout(() => {

        setUploadProgress(0);

        setUploadStage("");

      }, 800);

    }
  };


  // ==========================================================
  // DATASET INFORMATION
  // ==========================================================

  const columnsInfo =
    Array.isArray(
      dataset?.columnsInfo
    )
      ? dataset.columnsInfo
      : [];


  const semanticColumns =
    Array.isArray(
      dataset?.semanticSchema?.columns
    )
      ? dataset.semanticSchema.columns
      : [];


  const capabilities =
    Array.isArray(
      dataset?.semanticSchema?.capabilities
    )
      ? dataset.semanticSchema.capabilities
      : [];


  // ==========================================================
  // RESULT INFORMATION
  // ==========================================================

  const evidence =
    result?.evidence || null;

  const plan =
    result?.plan || null;

  const aiAnalysis =
    result
      ? parseAnalysis(
          result.analysis
        )
      : null;


  const findings =
    Array.isArray(
      aiAnalysis?.findings
    )
      ? aiAnalysis.findings
      : [];


  const possibleCauses =
    Array.isArray(
      aiAnalysis?.possibleCauses
    )
      ? aiAnalysis.possibleCauses
      : [];


  const recommendations =
    Array.isArray(
      aiAnalysis?.recommendations
    )
      ? aiAnalysis.recommendations
      : [];


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="app-layout">

      <Sidebar />


      <main className="main-content">

        <Topbar />


        <section className="dashboard">


          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <div className="page-heading">

            <div>

              <p className="eyebrow">
                BUSINESS INTELLIGENCE
              </p>

              <h1>
                Good morning.
              </h1>

              <p className="subtitle">
                Upload your data and let DOXA investigate
                what is happening.
              </p>

            </div>

          </div>


          {/* ==================================================
              DATASET UPLOAD
          ================================================== */}

          <div className="panel upload-panel">

            <div className="panel-header">

              <div>

                <p className="eyebrow">
                  DATASET
                </p>

                <h2>
                  Upload your business data
                </h2>

                <p className="subtitle">
                  Upload a CSV and let DOXA understand
                  the structure and meaning of your data.
                </p>

              </div>

            </div>


            {/* =================================================
                UPLOAD AREA
            ================================================= */}

            <label
              className={`upload-box ${
                uploading
                  ? "uploading"
                  : ""
              }`}
            >

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleCsvUpload
                }
                disabled={
                  uploading
                }
              />


              {!uploading ? (

                <>
                  <div className="upload-icon">
                    ↑
                  </div>

                  <strong>
                    Choose a CSV file
                  </strong>

                  <span>
                    CSV files up to 10 MB
                  </span>
                </>

              ) : (

                <div className="upload-progress">


                  {/* LOADING RING */}

                  <div className="upload-loader">

                    <div className="loader-ring" />

                    <span>
                      {uploadProgress}%
                    </span>

                  </div>


                  {/* CURRENT STAGE */}

                  <strong>
                    {uploadStage}
                  </strong>

                  <span>
                    DOXA is preparing your dataset
                  </span>


                  {/* PROGRESS BAR */}

                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${uploadProgress}%`
                      }}
                    />

                  </div>


                  {/* PROCESSING STEPS */}

                  <div className="processing-steps">

                    {uploadSteps.map(
                      (step) => {

                        const completed =
                          uploadProgress >=
                          step.id * 20;

                        const active =
                          !completed &&
                          uploadProgress >=
                          (step.id - 1) * 20;

                        return (

                          <div
                            key={step.id}
                            className={`
                              step
                              ${
                                completed
                                  ? "completed"
                                  : ""
                              }
                              ${
                                active
                                  ? "active"
                                  : ""
                              }
                            `}
                          >

                            <span className="step-dot">

                              {completed
                                ? "✓"
                                : step.id}

                            </span>

                            <span>
                              {step.label}
                            </span>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>

              )}

            </label>


            {/* UPLOAD ERROR */}

            {uploadError && (

              <p className="error-message">
                {uploadError}
              </p>

            )}


            {/* =================================================
                DATASET SUMMARY
            ================================================= */}

            {dataset && (

              <div className="dataset-summary">

                <div>

                  <strong>
                    {dataset.filename}
                  </strong>

                  <span>
                    {formatNumber(
                      dataset.rows
                    )} rows ·{" "}
                    {formatNumber(
                      dataset.columns
                    )} columns
                  </span>

                </div>


                <div className="dataset-columns">

                  {columnsInfo.map(
                    (column) => (

                      <span
                        key={
                          column.name
                        }
                        title={
                          `Type: ${column.type}`
                        }
                      >
                        {column.name}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              DATASET OVERVIEW
          ================================================== */}

          {dataset && (

            <div className="metrics-grid">

              <MetricCard
                label="Rows"
                value={
                  formatNumber(
                    dataset.rows
                  )
                }
                change="Dataset size"
              />

              <MetricCard
                label="Columns"
                value={
                  formatNumber(
                    dataset.columns
                  )
                }
                change={
                  dataset.datasetType ||
                  "Tabular dataset"
                }
              />

              <MetricCard
                label="Numeric Fields"
                value={
                  formatNumber(
                    dataset.numericColumns
                      ?.length || 0
                  )
                }
                change="Available measures"
              />

              <MetricCard
                label="Capabilities"
                value={
                  formatNumber(
                    capabilities.length
                  )
                }
                change="Detected by DOXA"
              />

            </div>

          )}


          {/* ==================================================
              DATASET UNDERSTANDING
          ================================================== */}

          {dataset && (

            <div className="dashboard-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <p className="eyebrow">
                      UNDERSTANDING
                    </p>

                    <h2>
                      What DOXA found
                    </h2>

                  </div>

                </div>


                <div className="result-content">

                  <div className="evidence-grid">

                    <div>

                      <strong>
                        Dataset type
                      </strong>

                      <span>
                        {dataset.datasetType ||
                          "Tabular"}
                      </span>

                    </div>


                    <div>

                      <strong>
                        Date fields
                      </strong>

                      <span>
                        {formatNumber(
                          dataset.dateColumns
                            ?.length || 0
                        )}
                      </span>

                    </div>


                    <div>

                      <strong>
                        Numeric fields
                      </strong>

                      <span>
                        {formatNumber(
                          dataset.numericColumns
                            ?.length || 0
                        )}
                      </span>

                    </div>

                  </div>


                  {capabilities.length > 0 && (

                    <>

                      <h3>
                        Available analysis
                      </h3>

                      <div className="dataset-columns">

                        {capabilities.map(
                          (capability) => (

                            <span
                              key={
                                capability
                              }
                            >
                              {capability}
                            </span>

                          )
                        )}

                      </div>

                    </>

                  )}


                  {semanticColumns.length > 0 && (

                    <>

                      <h3>
                        Semantic fields
                      </h3>

                      <div className="findings-list">

                        {semanticColumns.map(
                          (column) => (

                            <div
                              className="finding-card"
                              key={
                                column.name
                              }
                            >

                              <div className="finding-number">
                                •
                              </div>

                              <div>

                                <h4>
                                  {column.name}
                                </h4>

                                <p>
                                  {column.roles?.join(
                                    " · "
                                  ) ||
                                    column.type}
                                </p>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </>

                  )}

                </div>

              </div>


              {/* CURRENT FILE */}

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <p className="eyebrow">
                      ACTIVE DATA
                    </p>

                    <h2>
                      Dataset ready
                    </h2>

                  </div>

                </div>


                <div className="insight">

                  <span className="insight-icon">
                    ✓
                  </span>

                  <div>

                    <h3>
                      DOXA is ready
                    </h3>

                    <p>
                      Ask a question about{" "}
                      <strong>
                        {uploadedFile?.name ||
                          dataset.filename}
                      </strong>{" "}
                      and DOXA will create an
                      investigation plan from
                      the available data.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              ASK DOXA + STATUS
          ================================================== */}

          <div className="dashboard-grid">


            {/* ASK DOXA */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <p className="eyebrow">
                    INVESTIGATION
                  </p>

                  <h2>
                    Ask DOXA
                  </h2>

                </div>

              </div>


              <div className="investigation-input">

                <input
                  type="text"
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleInvestigation();
                    }

                  }}
                  placeholder={
                    dataset
                      ? "Ask something about your data..."
                      : "Upload a CSV first..."
                  }
                  disabled={
                    !dataset ||
                    loading
                  }
                />


                <button
                  onClick={
                    handleInvestigation
                  }
                  disabled={
                    !dataset ||
                    loading
                  }
                >

                  {loading
                    ? "Investigating..."
                    : "Investigate"}

                </button>

              </div>


              {!dataset && (

                <p className="empty-state">
                  Upload a dataset before asking
                  DOXA a question.
                </p>

              )}


              {error && (

                <p className="error-message">
                  {error}
                </p>

              )}

            </div>


            {/* INVESTIGATION STATUS */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <p className="eyebrow">
                    INVESTIGATION STATUS
                  </p>

                  <h2>
                    {loading
                      ? "DOXA is investigating"
                      : result
                      ? "Investigation complete"
                      : "Ready to investigate"}
                  </h2>

                </div>

              </div>


              <div className="insight">

                <span className="insight-icon">

                  {loading
                    ? "..."
                    : result
                    ? "✓"
                    : "?"}

                </span>

                <div>

                  <h3>
                    {loading
                      ? "Analyzing your question"
                      : result
                      ? "Evidence collected"
                      : "Ask your first question"}
                  </h3>

                  <p>

                    {loading
                      ? "DOXA is selecting an analysis operation, calculating evidence, and preparing an explanation."
                      : result
                      ? "The deterministic analysis engine has produced evidence for this investigation."
                      : "DOXA will understand your question, build a plan, calculate the evidence, and explain the result."}

                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              INVESTIGATION RESULT
          ================================================== */}

          {result && (

            <div className="panel investigation-result">

              <div className="panel-header">

                <div>

                  <p className="eyebrow">
                    DOXA INVESTIGATION
                  </p>

                  <h2>
                    {result.question}
                  </h2>

                </div>

              </div>


              <div className="result-content">


                {/* =================================================
                    ANALYSIS PLAN
                ================================================= */}

                {plan && (

                  <>

                    <h3>
                      Investigation plan
                    </h3>

                    <div className="evidence-grid">

                      <div>

                        <strong>
                          Operation
                        </strong>

                        <span>
                          {plan.operation ||
                            "—"}
                        </span>

                      </div>


                      {plan.groupBy && (

                        <div>

                          <strong>
                            Group by
                          </strong>

                          <span>
                            {plan.groupBy}
                          </span>

                        </div>

                      )}


                      {plan.measure && (

                        <div>

                          <strong>
                            Measure
                          </strong>

                          <span>
                            {plan.measure}
                          </span>

                        </div>

                      )}


                      {plan.aggregation && (

                        <div>

                          <strong>
                            Aggregation
                          </strong>

                          <span>
                            {plan.aggregation}
                          </span>

                        </div>

                      )}

                    </div>

                  </>

                )}


                {/* =================================================
                    EVIDENCE
                ================================================= */}

                <h3>
                  Evidence collected
                </h3>


                <div className="evidence-grid">

                  {evidence &&
                    Object.entries(
                      evidence
                    )
                      .filter(
                        ([key]) =>
                          ![
                            "rows",
                            "results"
                          ].includes(key)
                      )
                      .slice(0, 6)
                      .map(
                        ([key, value]) => (

                          <div
                            key={key}
                          >

                            <strong>
                              {key}
                            </strong>

                            <span>
                              {typeof value ===
                              "object"
                                ? getDisplayText(
                                    value
                                  )
                                : getDisplayText(
                                    value
                                  )}
                            </span>

                          </div>

                        )
                      )}

                </div>


                {/* =================================================
                    GROUP RESULTS
                ================================================= */}

                {Array.isArray(
                  evidence?.results
                ) &&
                  evidence.results.length >
                    0 && (

                    <>

                      <h3>
                        Analysis results
                      </h3>

                      <div className="findings-list">

                        {evidence.results
                          .slice(
                            0,
                            10
                          )
                          .map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                className="finding-card"
                                key={
                                  index
                                }
                              >

                                <div className="finding-number">
                                  {index + 1}
                                </div>

                                <div>

                                  <h4>
                                    {item.group ||
                                      item.value ||
                                      item.date ||
                                      "Result"}
                                  </h4>

                                  <p>
                                    {item.value !==
                                    undefined
                                      ? `Value: ${getDisplayText(
                                          item.value
                                        )}`
                                      : item.count !==
                                        undefined
                                      ? `Count: ${getDisplayText(
                                          item.count
                                        )}`
                                      : getDisplayText(
                                          item
                                        )}
                                  </p>

                                </div>

                              </div>

                            )
                          )}

                      </div>

                    </>

                  )}


                {/* =================================================
                    FINDINGS
                ================================================= */}

                <h3>
                  Findings
                </h3>


                {findings.length > 0 ? (

                  <div className="findings-list">

                    {findings.map(
                      (
                        finding,
                        index
                      ) => (

                        <div
                          className="finding-card"
                          key={
                            index
                          }
                        >

                          <div className="finding-number">
                            {index + 1}
                          </div>

                          <div>

                            <h4>
                              {getDisplayText(
                                finding?.title
                              )}
                            </h4>

                            <p>
                              {getDisplayText(
                                finding?.evidence
                              )}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="empty-state">
                    No findings were returned.
                  </p>

                )}


                {/* =================================================
                    POSSIBLE CAUSES
                ================================================= */}

                <h3>
                  Possible Causes
                </h3>


                {possibleCauses.length > 0 ? (

                  <div className="causes-list">

                    {possibleCauses.map(
                      (
                        cause,
                        index
                      ) => (

                        <div
                          className="cause-item"
                          key={
                            index
                          }
                        >

                          <span>
                            •
                          </span>

                          <div>

                            {typeof cause ===
                            "object" ? (

                              <>

                                {cause.cause && (

                                  <strong>
                                    {getDisplayText(
                                      cause.cause
                                    )}
                                  </strong>

                                )}

                                {cause.title && (

                                  <strong>
                                    {getDisplayText(
                                      cause.title
                                    )}
                                  </strong>

                                )}

                                {cause.status && (

                                  <p>
                                    Status:{" "}
                                    {
                                      cause.status
                                    }
                                  </p>

                                )}

                                {cause.data && (

                                  <p>
                                    {getDisplayText(
                                      cause.data
                                    )}
                                  </p>

                                )}

                                {!cause.cause &&
                                  !cause.title &&
                                  !cause.data && (

                                    <p>
                                      {getDisplayText(
                                        cause
                                      )}
                                    </p>

                                  )}

                              </>

                            ) : (

                              <p>
                                {getDisplayText(
                                  cause
                                )}
                              </p>

                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="empty-state">
                    No possible causes were identified.
                  </p>

                )}


                {/* =================================================
                    BUSINESS IMPACT
                ================================================= */}

                <h3>
                  Business Impact
                </h3>


                <div className="impact-card">

                  <strong>
                    Impact
                  </strong>

                  <p>
                    {getDisplayText(
                      aiAnalysis
                        ?.impact
                        ?.description
                    ) ||
                      "No specific business impact information was returned."}
                  </p>

                </div>


                {/* =================================================
                    RECOMMENDATIONS
                ================================================= */}

                <h3>
                  Recommendations
                </h3>


                {recommendations.length > 0 ? (

                  <div className="recommendations-list">

                    {recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (

                        <div
                          className="recommendation-card"
                          key={
                            index
                          }
                        >

                          <span>
                            →
                          </span>

                          <div>

                            <h4>

                              {typeof recommendation ===
                              "object"
                                ? getDisplayText(
                                    recommendation.title ||
                                      recommendation.description ||
                                      recommendation.data
                                  )
                                : getDisplayText(
                                    recommendation
                                  )}

                            </h4>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="empty-state">
                    No recommendations were returned.
                  </p>

                )}

              </div>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}


export default Dashboard;