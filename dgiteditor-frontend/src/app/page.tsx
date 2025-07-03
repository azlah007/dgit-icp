"use client";
import { useState, useEffect } from "react";
import { dgitRepoBackend } from "@/lib/ic/actors/dgit_repo_backend";
import Editor from "@monaco-editor/react";
import FileTree from "@/components/FileTree";

export default function Home() {
  const repoName = "test-repo";

  const [branchName, setBranchName] = useState("master");
  const [branches, setBranches] = useState<string[]>(["master"]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState<string>("");

  const [commitHistory, setCommitHistory] = useState<{ hash: string; message: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [newCollaborator, setNewCollaborator] = useState("");

  const [newBranchName, setNewBranchName] = useState("");
  const [mergeSourceBranch, setMergeSourceBranch] = useState("");
  const [mergeTargetBranch, setMergeTargetBranch] = useState("");

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const result = await dgitRepoBackend.listBranches(repoName);
      setBranches(Array.isArray(result) ? result : ["master"]);
    } catch (e) {
      console.error("Error fetching branches:", e);
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    try {
      const result = await dgitRepoBackend.listFiles(repoName);
      setFiles(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Error fetching files:", e);
    }
  };

  // Fetch file content
  const fetchFileContent = async (fileName: string) => {
    try {
      const content = await dgitRepoBackend.getFileContent(repoName, branchName, fileName);
      setFileContents(typeof content === "string" ? content : "// File empty or not found.");
    } catch (e) {
      console.error("Error fetching file content:", e);
      setFileContents("// Error loading file content.");
    }
  };

  // Select file
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    fetchFileContent(fileName);
  };

  // Fetch commit history
  const fetchCommitHistory = async () => {
    try {
      const hashes = await dgitRepoBackend.getCommitHistory(repoName, branchName);
      if (Array.isArray(hashes)) {
        const history = await Promise.all(
          hashes.map(async (hash) => {
            try {
              const msg = await dgitRepoBackend.getCommitMessage(repoName, hash);
              return { hash, message: typeof msg === "string" ? msg : "(No message)" };
            } catch {
              return { hash, message: "(Error fetching message)" };
            }
          })
        );
        setCommitHistory(history);
      }
    } catch (e) {
      console.error("Error fetching commit history:", e);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    try {
      const result = await dgitRepoBackend.listTags(repoName);
      setTags(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Error fetching tags:", e);
    }
  };

  // Add tag
  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      await dgitRepoBackend.createTag(repoName, newTag, branchName);
      setNewTag("");
      fetchTags();
    } catch (e) {
      console.error("Error adding tag:", e);
    }
  };

  // Fetch collaborators
  const fetchCollaborators = async () => {
    try {
      const result = await dgitRepoBackend.listCollaborators(repoName);
      setCollaborators(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Error fetching collaborators:", e);
    }
  };

  // Add collaborator
  const addCollaborator = async () => {
    if (!newCollaborator.trim()) return;
    try {
      await dgitRepoBackend.addCollaborator(repoName, newCollaborator);
      setNewCollaborator("");
      fetchCollaborators();
    } catch (e) {
      console.error("Error adding collaborator:", e);
    }
  };

  // Remove collaborator
  const removeCollaborator = async (user: string) => {
    if (!confirm(`Remove collaborator ${user}?`)) return;
    try {
      await dgitRepoBackend.removeCollaborator(repoName, user);
      fetchCollaborators();
    } catch (e) {
      console.error("Error removing collaborator:", e);
    }
  };

  // Commit code
  const handleCommit = async () => {
    if (!selectedFile || !commitMessage.trim()) return;
    try {
      await dgitRepoBackend.commitCode(repoName, branchName, [[selectedFile, fileContents]], commitMessage, "test-user");
      setCommitMessage("");
      fetchFiles();
      fetchCommitHistory();
    } catch (e) {
      console.error("Error committing code:", e);
    }
  };

  // Create new branch
  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await dgitRepoBackend.createBranch(repoName, newBranchName, branchName, "test-user");
      setNewBranchName("");
      fetchBranches();
    } catch (e) {
      console.error("Error creating branch:", e);
    }
  };

  // Merge branches
  const mergeBranches = async () => {
    if (!mergeSourceBranch.trim() || !mergeTargetBranch.trim()) return;
    try {
      await dgitRepoBackend.mergeBranches(repoName, mergeTargetBranch, mergeSourceBranch, "test-user");
      fetchCommitHistory();
      fetchFiles();
    } catch (e) {
      console.error("Error merging branches:", e);
    }
  };

  // Delete file
  const deleteFile = async () => {
    if (!selectedFile) return;
    if (!confirm(`Are you sure you want to delete ${selectedFile}?`)) return;
    try {
      await dgitRepoBackend.commitCode(repoName, branchName, [[selectedFile, ""]], `Deleted ${selectedFile}`, "test-user");
      setSelectedFile(null);
      setFileContents("");
      fetchFiles();
      fetchCommitHistory();
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  };

  // Change branch
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBranchName(e.target.value);
    setSelectedFile(null);
    setFileContents("");
  };

  useEffect(() => {
    fetchBranches();
    fetchFiles();
    fetchCommitHistory();
    fetchTags();
    fetchCollaborators();
  }, [branchName]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 text-white p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">dGIT Editor</h1>

        {/* Branch selector */}
        <label className="mb-2 font-semibold">
          Branch:
          <select className="ml-2 bg-gray-800 rounded px-2 py-1" value={branchName} onChange={handleBranchChange}>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        {/* Create branch */}
        <div className="flex space-x-2 mt-2">
          <input
            type="text"
            placeholder="New branch"
            className="flex-1 p-1 rounded text-black"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
          />
          <button className="bg-green-600 text-white px-3 rounded hover:bg-green-700" onClick={createBranch}>
            Add
          </button>
        </div>

        {/* Files */}
        <div className="mt-4 flex-1 overflow-auto border border-gray-700 rounded p-2 mb-4">
          <h2 className="text-lg font-semibold mb-2">Files</h2>
          <FileTree files={files} onFileSelect={handleFileSelect} />
        </div>

        {/* Commit History */}
        <div className="mb-4 border border-gray-700 rounded p-2 max-h-48 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Commit History</h2>
          <ul className="text-sm space-y-1">
            {commitHistory.map(({ hash, message }) => (
              <li key={hash} className="break-words border-b border-gray-700 pb-1">
                <strong>{hash}</strong>
                <br />
                <em className="text-gray-400">{message}</em>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div className="mb-4 border border-gray-700 rounded p-2">
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <ul className="text-sm space-y-1 max-h-24 overflow-auto">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              placeholder="New tag"
              className="flex-1 p-1 rounded text-black"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button className="bg-green-600 text-white px-3 rounded hover:bg-green-700" onClick={addTag}>
              Add
            </button>
          </div>
        </div>

        {/* Collaborators */}
        <div className="border border-gray-700 rounded p-2 max-h-40 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Collaborators</h2>
          <ul className="text-sm space-y-1 max-h-32 overflow-auto">
            {collaborators.map((user) => (
              <li key={user} className="flex justify-between items-center border-b border-gray-700 pb-1">
                <span>{user}</span>
                <button className="text-red-500 hover:text-red-700" onClick={() => removeCollaborator(user)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              placeholder="Add collaborator"
              className="flex-1 p-1 rounded text-black"
              value={newCollaborator}
              onChange={(e) => setNewCollaborator(e.target.value)}
            />
            <button className="bg-green-600 text-white px-3 rounded hover:bg-green-700" onClick={addCollaborator}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Editor Pane */}
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

        {/* Commit and Delete */}
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            placeholder="Commit message"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={handleCommit}>
            Commit
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={deleteFile}>
            Delete File
          </button>
        </div>

        {/* Merge */}
        <div className="flex space-x-2">
          <select
            className="flex-1 p-2 border border-gray-300 rounded text-black"
            value={mergeSourceBranch}
            onChange={(e) => setMergeSourceBranch(e.target.value)}
          >
            <option value="">Select source branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="flex-1 p-2 border border-gray-300 rounded text-black"
            value={mergeTargetBranch}
            onChange={(e) => setMergeTargetBranch(e.target.value)}
          >
            <option value="">Select target branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={mergeBranches}>
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}
