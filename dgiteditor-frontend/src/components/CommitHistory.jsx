import React, { useEffect, useState } from 'react';
import { dgit } from '../agent';

export default function CommitHistory({ repoName, branch }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (repoName) {
      fetchHistory();
    }
  }, [repoName, branch]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await dgit.getCommitHistory(repoName, branch);
      setHistory(res);
    } catch (err) {
      console.error('Error fetching commit history:', err);
      setHistory([]);
    }
    setLoading(false);
  };

  const showMessage = async (commitHash) => {
    try {
      const msg = await dgit.getCommitMessage(repoName, commitHash);
      alert(`Commit Message:\n${msg}`);
    } catch (err) {
      console.error('Error fetching commit message:', err);
      alert('Failed to fetch commit message.');
    }
  };

  return (
    <div>
      <h3>Commit History</h3>
      {loading ? (
        <p>Loading history...</p>
      ) : history.length === 0 ? (
        <p>No commits yet.</p>
      ) : (
        <ul>
          {history.map((h) => (
            <li key={h}>
              {h.slice(0, 8)}... 
              <button onClick={() => showMessage(h)}>View Message</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
