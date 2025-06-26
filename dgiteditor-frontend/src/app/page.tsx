'use client';
import { useState } from "react";
import Auth from "@/components/Auth";
import Editor from "@monaco-editor/react";
import FileTree from "@/components/FileTree";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string>("");

  // Static file list for now (replace with backend fetch later)
  const files = ["main.mo", "lib.mo", "README.md"];

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    // Dummy content for now, real content will come from backend
    setFileContents(`// Contents of ${fileName}`);
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

        <div className="flex-1 border border-gray-300 bg-white rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="motoko"
            value={fileContents}
            onChange={(newValue) => setFileContents(newValue || "")}
            theme="vs-dark"
          />
        </div>
      </div>
    </div>
  );
}
