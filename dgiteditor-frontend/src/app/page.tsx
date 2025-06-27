'use client';
import { useState, useEffect } from "react";
import Auth from "@/components/Auth";
import Editor from "@monaco-editor/react";
import FileTree from "@/components/FileTree";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);

  const repoName = "test-repo";
  const canisterId = "uxrrr-q7777-77774-qaaaq-cai";

  // Fetch file list on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:4943/?canisterId=${canisterId}/listFiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([repoName])  // Motoko expects a tuple-like argument in array form
        });

        // The response is usually a CBOR or blob, but assuming JSON array for dev
        const result = await response.json();

        if (Array.isArray(result)) {
          setFiles(result);
        } else {
          console.error("Unexpected response format from listFiles:", result);
          alert("Failed to load files: unexpected response format.");
        }
      } catch (error) {
        console.error("Error fetching file list:", error);
        alert("Failed to fetch file list. Is your canister running?");
      }
    };

    fetchFiles();
  }, []);

  // When user selects a file from the sidebar
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    // TODO: Replace with real content fetched from backend
    setFileContents(`// Contents of ${fileName}`);
  };

  // Commit the current file with the commit message
  const handleCommit = async () => {
    if (!selectedFile) {
      alert("Please select a file to commit.");
      return;
    }
    if (!commitMessage.trim()) {
      alert("Please enter a commit message.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:4943/?canisterId=${canisterId}/commitCode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName,
          branch: "master",
          fileList: [[selectedFile, fileContents]],
          message: commitMessage,
          author: "test-user"
        })
      });

      // Expecting plain text response
      const result = await response.text();
      alert(result);
      setCommitMessage("");
    } catch (error) {
      console.error("Commit failed:", error);
      alert("Commit failed. Check console for details.");
    }
  };

  return (
    <div className="flex h-screen">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-4">dGIT Editor</h1>
        <FileTree files={files} onFileSelect={handleFileSelect} />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 bg-gray-100 p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">
          {selectedFile ? `Editing: ${selectedFile}` : "Select a file to start editing"}
        </h2>

        <div className="flex-1 border border-gray-300 bg-white rounded overflow-hidden mb-4">
          <Editor
            height="100%"
            defaultLanguage="motoko"
            value={fileContents}
            onChange={(newValue) => setFileContents(newValue || "")}
            theme="vs-dark"
          />
        </div>

        {/* Commit Section */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Commit message"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleCommit}
          >
            Commit
          </button>
        </div>
      </div>
    </div>
  );
}
