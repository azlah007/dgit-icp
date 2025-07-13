"use client";

import React, { useEffect, useState } from "react";

export default function FileTree({
  dgitRepoBackend,
  repoName,
  setCurrentFile,
  setFileContent,
  branch,
  currentFile,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (repoName && branch && dgitRepoBackend) {
      fetchFiles();
    }
  }, [repoName, branch, dgitRepoBackend]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await dgitRepoBackend.listFiles(repoName, branch);
      console.log("📁 [FileTree] Fetched files:", res);
      setFiles(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    }
    setLoading(false);
  };

  const openFile = async (fileName) => {
    try {
      const content = await dgitRepoBackend.getFileContent(repoName, branch, fileName);
      console.log("📄 [FileTree] Opened content for", fileName, ":", content);

      if (Array.isArray(content)) {
        setCurrentFile(fileName);
        setFileContent(content[0] || "");
      } else if (typeof content === "string") {
        setCurrentFile(fileName);
        setFileContent(content);
      } else {
        setFileContent("// File empty or not found");
      }
    } catch (err) {
      console.error("Error opening file:", err);
      setFileContent("// Error opening file.");
    }
  };

  const deleteFile = async (fileName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${fileName}"?`);
    if (!confirmDelete) return;

    try {
      await dgitRepoBackend.commitCode(
        repoName,
        branch,
        [[fileName, ""]],
        `Deleted file ${fileName}`,
        "system"
      );

      if (fileName === currentFile) {
        setCurrentFile(null);
        setFileContent("");
      }
      await fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  return (
    <div>
      <h3>📁 File Tree</h3>

      {loading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>No files found in this branch.</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f}>
              📄 {f}
              <button onClick={() => openFile(f)} style={{ marginLeft: "5px" }}>
                Open
              </button>
              <button onClick={() => deleteFile(f)} style={{ marginLeft: "5px" }}>
                🗑️ Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
