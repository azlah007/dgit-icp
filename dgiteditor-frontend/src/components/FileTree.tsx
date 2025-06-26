'use client';
import { useState } from "react";

interface FileTreeProps {
  files: string[];
  onFileSelect: (fileName: string) => void;
}

export default function FileTree({ files, onFileSelect }: FileTreeProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">File Tree</h2>
      <ul className="space-y-1">
        {files.map((file, index) => (
          <li
            key={index}
            className="cursor-pointer hover:bg-gray-800 p-1 rounded"
            onClick={() => onFileSelect(file)}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
}
