import React, { useEffect, useState } from 'react';

export default function FileManager({ repoName, setCurrentFile, setFileContent }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const files = await window.dgit.listFiles(repoName);
    setFiles(files);
  };

  const openFile = async (fileName) => {
    const content = await window.dgit.getFileContent(repoName, 'master', fileName);
    setCurrentFile(fileName);
    setFileContent(content || '');
  };

  return (
    <div>
      <h3>Files</h3>
      <ul>
        {files.map((file) => (
          <li key={file}>
            {file} 
            <button onClick={() => openFile(file)}>Open</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
