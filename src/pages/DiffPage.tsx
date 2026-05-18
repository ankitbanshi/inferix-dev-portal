import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiffView } from '../components/DiffView';

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/>
  </svg>
);

export const DiffPage = () => {
  const navigate = useNavigate();
  const [text1, setText1] = useState(
    'The quick brown fox jumps over the lazy dog. This is a sample text for comparison.'
  );
  const [text2, setText2] = useState(
    'The quick red fox leaps over the sleeping dog. This is a sample text for testing.'
  );
  const [showDiff, setShowDiff] = useState(true);

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-[#e6edf3] font-sans flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-[#30363d] flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-[#30363d] rounded-full transition-colors duration-150"
            aria-label="Go back to playground"
          >
            <BackIcon />
          </button>
          <div className="text-lg font-bold">Model Diff Viewer</div>
        </div>
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="text-sm px-4 py-1.5 bg-[#2563eb] hover:bg-blue-700 transition-colors duration-150 text-white rounded-md"
          aria-label={showDiff ? 'Edit texts' : 'Compare versions'}
        >
          {showDiff ? 'Edit' : 'Compare'}
        </button>
      </header>

      {/* Content */}
      {showDiff ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <DiffView text1={text1} text2={text2} label1="Version A" label2="Version B" />
        </div>
      ) : (
        <div className="flex-1 flex gap-4 p-6 overflow-hidden">
          {/* Input Text 1 */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
              Version A
            </label>
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              className="flex-1 bg-[#161b22] border border-[#30363d] rounded p-4 text-white focus:outline-none focus:border-[#2563eb] resize-none"
              placeholder="Paste or type text here..."
            />
          </div>

          {/* Input Text 2 */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
              Version B
            </label>
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              className="flex-1 bg-[#161b22] border border-[#30363d] rounded p-4 text-white focus:outline-none focus:border-[#2563eb] resize-none"
              placeholder="Paste or type text here..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffPage;
