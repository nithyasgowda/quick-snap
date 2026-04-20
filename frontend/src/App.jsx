// App.jsx (merge into your existing file)
import { useState, useRef } from "react";
import axios from "axios";
import "./index.css";
import { FiDownload, FiCopy } from "react-icons/fi";

const API = "http://localhost:4000";

export default function App() {
  const [url, setUrl] = useState("");
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [code, setCode] = useState(null); // { html, css }
  const imgBlobRef = useRef(null);
  const analysisRef = useRef(null);

  const isValidUrl = (v) => /^https?:\/\/.+/i.test(v);

  async function onCapture(e) {
    e.preventDefault();
    setAnalysis(null);
    setErr("");
    setCode(null); // clear previous code
    if (!isValidUrl(url)) {
      setErr("Enter a valid URL starting with http:// or https://");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${API}/screenshot`,
        { url },
        { responseType: "blob", timeout: 45000 },
      );
      const blob = res.data;
      imgBlobRef.current = blob;
      const localUrl = URL.createObjectURL(blob);
      setImgUrl(localUrl);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Capture failed");
    } finally {
      setLoading(false);
    }
  }

  function onDownload() {
    if (!imgBlobRef.current) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(imgBlobRef.current);
    a.download = "screenshot.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onAnalyze() {
    if (!imgBlobRef.current) return;
    setErr("");
    setAnalysis(null);
    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", imgBlobRef.current, "screenshot.png");
      const res = await axios.post(`${API}/analyze-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(res.data);

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  // NEW: Generate HTML+CSS — calls /get-code
  async function onGenerateCode() {
    if (!isValidUrl(url)) {
      setErr("Enter a valid URL before generating code");
      return;
    }
    setErr("");
    setCode(null);
    try {
      setLoading(true);
      const res = await axios.post(`${API}/get-code`, { url });
      setCode({ html: res.data.html || "", css: res.data.css || "" });

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Failed to get code");
    } finally {
      setLoading(false);
    }
  }

  // Helpers: download files or copy
  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      alert("Copy failed");
    }
  }

  return (
    <div className="container">
      <header>
        <h1>QuickSnap</h1>
        <form onSubmit={onCapture}>
          <div className="data-field">
            <input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value.trim())}
            />
            <button type="submit" className="captureBtn btn" disabled={loading}>
              {loading ? "Capturing…" : "Capture"}
            </button>
          </div>
        </form>
      </header>

      {err && <p className="errMsg">{err}</p>}

      <div className="screenshot-container">
        <p className={!imgUrl ? "placeholder-text" : "placeholder-text hide"}>
          {err ? "" : "Your screenshot will appear here"}
        </p>
        {loading && <div className="loading"></div>}
        {imgUrl && (
          <div className="result-container">
            <div className="btn-div">
              <button
                onClick={onDownload}
                className="btn"
                title="Download the snap"
              >
                Download PNG
              </button>
              <button
                onClick={onAnalyze}
                className="btn"
                title="Get OCR and Colors"
              >
                Analyze (OCR + Colors)
              </button>

              {/* NEW: Generate code button */}
              <button
                onClick={onGenerateCode}
                className="btn"
                title="Generate HTML + CSS for this page"
              >
                Generate code
              </button>
            </div>

            <img src={imgUrl} alt="Screenshot" className="screenshotImg" />

            {analysis && (
              <div ref={analysisRef} className="analyze-result">
                <div>
                  <h3>Extracted Text</h3>
                  <pre className="extracted-text">
                    {analysis.text?.trim() || "(no text found)"}
                  </pre>
                </div>
                <div>
                  <h3>Dominant Colors</h3>
                  <div className="dominant-colors">
                    {analysis.colors?.map((c, i) => (
                      <div key={i} className="color-block">
                        <div
                          className="colors"
                          style={{ background: c.hex }}
                        ></div>
                        <div className="hexValue">{c.hex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NEW: show code results */}
            {code && (
              <div className="code-result" ref={analysisRef}>
                <div className="code-heading">
                  <h3>Generated HTML</h3>
                  <div className="code-actions">
                    <button
                      className="code-btn"
                      title="Download"
                      onClick={() =>
                        downloadTextFile("capture.html", code.html)
                      }
                    >
                      <FiDownload />
                    </button>
                    <button
                      className="code-btn"
                      title="Copy code"
                      onClick={() => copyToClipboard(code.html)}
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <textarea
                  className="code-area"
                  rows={12}
                  value={code.html}
                  readOnly
                />

                <div className="code-heading">
                  <h3>Generated CSS</h3>
                  <div className="code-actions">
                    <button
                      className="code-btn"
                      title="Download"
                      onClick={() => downloadTextFile("styles.css", code.css)}
                    >
                      <FiDownload />
                    </button>
                    <button
                      className="code-btn"
                      title="Copy code"
                      onClick={() => copyToClipboard(code.css)}
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <textarea
                  className="code-area"
                  rows={12}
                  value={code.css}
                  readOnly
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
