"use client";
import { useState, useEffect } from "react";
import { createDgitRepoBackendActor } from "@/lib/ic/actors/dgit_repo_backend";
import Editor from "@monaco-editor/react";
import FileTree from "@/components/FileTree";

export default function Home() {
  const repoName = "test-repo";
  const [dgitRepoBackend, setDgitRepoBackend] = useState<any>(null);

  const [branchName, setBranchName] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<string[]>([]);

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

  useEffect(() => {
    (async () => {
      const actor = await createDgitRepoBackendActor();
      setDgitRepoBackend(actor);
    })();
  }, []);

  useEffect(() => {
    if (dgitRepoBackend) fetchBranches();
  }, [dgitRepoBackend]);

  const fetchBranches = async () => {
    try {
      let result = await dgitRepoBackend.listBranches(repoName);
      if (Array.isArray(result) && result.length > 0) {
        setBranches(result);
        setBranchName((prev) => prev || result[0]);
      } else {
        await dgitRepoBackend.createRepo(repoName, "test-user");
        await dgitRepoBackend.commitCode(repoName, "master", [], "Initial commit", "test-user");
        await dgitRepoBackend.createBranch(repoName, "master", "master", "test-user");
        const updated = await dgitRepoBackend.listBranches(repoName);
        setBranches(updated);
        setBranchName("master");
      }
    } catch (e) {
      console.error("Error fetching or initializing branches:", e);
      setBranches([]);
    }
  };

  const fetchFiles = async () => {
  try {
    const result = await dgitRepoBackend.listFiles(repoName, branchName);
    console.log("📦 [page.tsx] Fetched files:", result); // ✅ Add this
    setFiles(Array.isArray(result) ? result : []);
  } catch (e) {
    console.error("Error fetching files:", e);
  }
  };


  const fetchFileContent = async (fileName: string) => {
  try {
    const result = await dgitRepoBackend.getFileContent(repoName, branchName, fileName);
    console.log("[page.tsx] Content for", fileName, "=", result);

    if (Array.isArray(result)) {
      setFileContents(result[0]); // ✅ pick the string
    } else if (typeof result === "string") {
      setFileContents(result);
    } else {
      setFileContents("// File empty or not found");
    }
  } catch (e) {
    console.error("Error fetching file content:", e);
    setFileContents("// Error loading file content.");
  }
};






  const handleFileSelect = (rawName: string) => {
    const fileName = rawName.replace(" (uncommitted)", "");
    setSelectedFile(fileName);
    if (files.includes(fileName)) fetchFileContent(fileName);
    else setFileContents("");
  };

  const createNewFile = async () => {
  const fileName = prompt("Enter new file name:");
  if (!fileName || !branchName || !repoName) return;

  try {
    const alreadyExists = files.includes(fileName) || localFiles.includes(fileName);
    if (alreadyExists) {
      alert("File already exists.");
      return;
    }

    // Commit the empty file immediately
    await dgitRepoBackend.commitCode(
      repoName,
      branchName,
      [[fileName, ""]],
      `Created ${fileName}`,
      "test-user"
    );

    // Refresh state
    await fetchFiles();
    setSelectedFile(fileName);
    setFileContents("");

    alert(`Created and committed ${fileName}`);
  } catch (e) {
    console.error("Error creating new file:", e);
    alert("Failed to create new file.");
  }
};


  const handleCommit = async () => {
  if (!selectedFile || !commitMessage.trim()) return;
  try {
    await dgitRepoBackend.commitCode(
      repoName,
      branchName,
      [[selectedFile, fileContents]],
      commitMessage,
      "test-user"
    );
    setCommitMessage("");
    setLocalFiles((prev) => prev.filter((f) => f !== selectedFile));
    await fetchFiles();
    await fetchCommitHistory();
    await fetchFileContent(selectedFile); // ✅ Re-fetch committed content
  } catch (e) {
    console.error("Error committing code:", e);
  }
};


  const deleteFile = async () => {
    if (!selectedFile) return;
    if (!confirm(`Are you sure you want to delete ${selectedFile}?`)) return;
    try {
      await dgitRepoBackend.commitCode(
        repoName,
        branchName,
        [[selectedFile, ""]],
        `Deleted ${selectedFile}`,
        "test-user"
      );
      setSelectedFile(null);
      setFileContents("");
      setLocalFiles((prev) => prev.filter((f) => f !== selectedFile));
      fetchFiles();
      fetchCommitHistory();
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  };

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

  const fetchCommitHistory = async () => {
    try {
      const hashes = await dgitRepoBackend.getCommitHistory(repoName, branchName);
      const history = await Promise.all(
        hashes.map(async (hash: string) => {
          try {
            const msg = await dgitRepoBackend.getCommitMessage(repoName, hash);
            return { hash, message: typeof msg === "string" ? msg : "(No message)" };
          } catch {
            return { hash, message: "(Error fetching message)" };
          }
        })
      );
      setCommitHistory(history);
    } catch (e) {
      console.error("Error fetching commit history:", e);
    }
  };

  const fetchTags = async () => {
    try {
      const result = await dgitRepoBackend.listTags(repoName);
      setTags(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Error fetching tags:", e);
    }
  };

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

  const fetchCollaborators = async () => {
    try {
      const result = await dgitRepoBackend.listCollaborators(repoName);
      setCollaborators(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error("Error fetching collaborators:", e);
    }
  };

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

  const removeCollaborator = async (user: string) => {
    if (!confirm(`Remove collaborator ${user}?`)) return;
    try {
      await dgitRepoBackend.removeCollaborator(repoName, user);
      fetchCollaborators();
    } catch (e) {
      console.error("Error removing collaborator:", e);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;
    setBranchName(newBranch);
    setFileContents(""); // clear stale content
    setLocalFiles([]);
  };

  useEffect(() => {
    if (branchName) {
      fetchFiles();
      fetchCommitHistory();
      fetchTags();
      fetchCollaborators();
    }
  }, [branchName]);

  useEffect(() => {
    if (selectedFile && files.includes(selectedFile)) {
      fetchFileContent(selectedFile);
    }
  }, [branchName, selectedFile, files]);

  if (!dgitRepoBackend) return <div className="p-4">Initializing actor...</div>;

  const allFiles = [...files, ...localFiles.map((f) => `${f} (uncommitted)`)];


  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 text-white p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">dGIT Editor</h1>

        <button
          className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 mb-2"
          onClick={createNewFile}
        >
          New File
        </button>

        <label className="mb-2 font-semibold">
          Branch:
          <select
            className="ml-2 bg-gray-800 rounded px-2 py-1"
            value={branchName}
            onChange={handleBranchChange}
            disabled={branches.length === 0}
          >
            {branches.length === 0 ? (
              <option>Loading...</option>
            ) : (
              branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))
            )}
          </select>
        </label>

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

        <div className="mt-4 flex-1 overflow-auto border border-gray-700 rounded p-2 mb-4">
          <h2 className="text-lg font-semibold mb-2">Files</h2>
        <FileTree
        dgitRepoBackend={dgitRepoBackend}
        repoName={repoName}
        branch={branchName}
        setCurrentFile={setSelectedFile}
        setFileContent={setFileContents}
        currentFile={selectedFile}
       />



        </div>

        {/* Commit History */}
        <div className="mb-4 border border-gray-700 rounded p-2 max-h-48 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Commit History</h2>
          <ul className="text-sm space-y-1">
            {commitHistory.map(({ hash, message }) => (
              <li key={hash} className="break-words border-b border-gray-700 pb-1">
                <strong>{hash}</strong><br />
                <em className="text-gray-400">{message}</em>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div className="mb-4 border border-gray-700 rounded p-2">
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <ul className="text-sm space-y-1 max-h-24 overflow-auto">
            {tags.map((tag) => <li key={tag}>{tag}</li>)}
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

      {/* Editor */}
      <div className="flex-1 bg-gray-100 p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">
          {selectedFile ? `Editing: ${selectedFile}` : "Select a file to start editing"}
        </h2>

        <div className="flex-1 border border-gray-300 bg-white rounded overflow-hidden mb-4">
        <Editor
          key={selectedFile}
          height="100%"
          defaultLanguage="motoko"
          value={typeof fileContents === "string" ? fileContents : "// Invalid file content"}
          onChange={(newValue) => setFileContents(newValue || "")}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, automaticLayout: true }}
        />

        </div>

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

        <div className="flex space-x-2">
          <select
            className="flex-1 p-2 border border-gray-300 rounded text-black"
            value={mergeSourceBranch}
            onChange={(e) => setMergeSourceBranch(e.target.value)}
          >
            <option value="">Select target branch</option>
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
            <option value="">Select source branch</option>
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
