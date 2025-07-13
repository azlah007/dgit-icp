import React, { useEffect, useState } from 'react';
import { dgitRepoBackend } from '@/lib/ic/actors/dgit_repo_backend'; // ✅ Correct actor import

export default function BranchManager({ repoName, branch, setBranch }) {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (repoName) {
      fetchBranches();
    }
  }, [repoName]);

  const fetchBranches = async () => {
    setStatusMsg('');
    try {
      const res = await dgitRepoBackend.listBranches(repoName);
      if (Array.isArray(res)) {
        setBranches(res);
        if (res.length === 0) {
          setStatusMsg('No branches found.');
        }
      } else {
        setStatusMsg('Unexpected response.');
        console.warn("Unexpected branch list:", res);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setStatusMsg('Error fetching branches.');
    }
  };

  const createBranch = async () => {
  const trimmedNew = newBranch.trim();
  const trimmedSource = sourceBranch.trim();
  if (!trimmedNew || !trimmedSource) {
    alert('Please enter both new branch name and source branch.');
    return;
  }

  try {
    const result = await dgitRepoBackend.createBranch(repoName, trimmedNew, trimmedSource, "test-user");
    console.log("Branch creation result:", result);
    if (typeof result === "string") {
      alert(result);
    }
    setNewBranch('');
    setSourceBranch('');

    const updatedBranches = await dgitRepoBackend.listBranches(repoName);
    setBranches(updatedBranches);

    // Optional: auto-switch to new branch
    if (updatedBranches.includes(trimmedNew)) {
      setBranch(trimmedNew);
    }
  } catch (err) {
    console.error('Error creating branch:', err);
    alert('Failed to create branch.');
  }
};


  return (
    <div>
      <h3>Branches</h3>

      {statusMsg && <p>{statusMsg}</p>}

      {branches.length === 0 ? (
        <p>No branches available.</p>
      ) : (
        <ul>
          {branches.map((b) => (
            <li key={b}>
              {b}
              {b === branch ? ' (Active)' : (
                <button onClick={() => setBranch(b)}>Switch</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h4>Create New Branch</h4>
      <input
        type="text"
        placeholder="New branch name"
        value={newBranch}
        onChange={(e) => setNewBranch(e.target.value)}
      />
      <select
  value={sourceBranch}
  onChange={(e) => setSourceBranch(e.target.value)}
>
  <option value="">Select source branch</option>
  {branches.map((b) => (
    <option key={b} value={b}>{b}</option>
  ))}
</select>

      <button onClick={createBranch}>Create Branch</button>
    </div>
  );
}
