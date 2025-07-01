'use client';
import { useState, useEffect } from "react";
import { dgitRepoBackend } from "@/lib/ic/actor";
import Editor from "@monaco-editor/react";
import FileTree from "@/components/FileTree";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);

  const repoName = "test-repo";

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const result = await dgitRepoBackend.listFiles(repoName); // ✅ pass as Text, not [Text]
        if (Array.isArray(result)) {
          setFiles(result);
        } else {
          console.error("Unexpected response from canister:", result);
          alert("Unexpected response format. Check console.");
        }
      } catch (error) {
        console.error("Canister call failed:", error);
        alert("Failed to fetch files from canister.");
      }
    };

    fetchFiles();
  }, []);

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setFileContents(`// Contents of ${fileName}`);
  };

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
      const response = await fetch("http://127.0.0.1:4943/commitCode?canisterId=uxrrr-q7777-77774-qaaaq-cai", {
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

      const result = await response.text();
      alert(result);
      setCommitMessage("");
    } catch (error) {
      console.error("Commit failed:", error);
      alert("Commit failed. Check the console.");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-4">dGIT Editor</h1>
        <FileTree files={files} onFileSelect={handleFileSelect} />
      </div>

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
