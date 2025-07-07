import React, { useEffect, useState } from 'react';
import { dgit } from '../agent';

export default function MergeManager({ repoName, branch }) {
  const [branches, setBranches] = useState([]);
  const [sourceBranch, setSourceBranch] = useState('');
  const [mergeMsg, setMergeMsg] = useState('');

  useEffect(() => {
    fetchBranches();
  }, [repoName]);

  const fetchBranches = async () => {
    try {
      const res = await dgit.listBranches(repoName);
      setBranches(res);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const mergeBranch = async () => {
    if (!sourceBranch) {
      alert('Select a source branch to merge.');
      return;
    }

    try {
      const res = await dgit.mergeBranches(repoName, sourceBranch, branch, 'owner');
      setMergeMsg(res);
    } catch (err) {
      console.error('Error merging branches:', err);
      setMergeMsg('Merge failed.');
    }
  };

  return (
    <div>
      <h3>Merge Branch</h3>
      <p>Merge another branch into <strong>{branch}</strong></p>
      <select value={sourceBranch} onChange={(e) => setSourceBranch(e.target.value)}>
        <option value="">Select source branch</option>
        {branches.filter(b => b !== branch).map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <button onClick={mergeBranch} style={{ marginLeft: '10px' }}>🔀 Merge</button>
      {mergeMsg && <p>{mergeMsg}</p>}
    </div>
  );
}
