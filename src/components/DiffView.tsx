import { diffTexts, type DiffToken } from '../lib/diff';

interface DiffViewProps {
  text1: string;
  text2: string;
  label1?: string;
  label2?: string;
}

const DiffTokenDisplay: React.FC<{ token: DiffToken }> = ({ token }) => {
  switch (token.type) {
    case 'added':
      return (
        <span style={{ backgroundColor: '#1a4a2e', color: '#3fb950', borderRadius: '3px', padding: '0 3px' }}>
          {token.word}
        </span>
      );
    case 'removed':
      return (
        <span style={{ backgroundColor: '#4a1a1a', color: '#f85149', borderRadius: '3px', padding: '0 3px', textDecoration: 'line-through' }}>
          {token.word}
        </span>
      );
    case 'same':
    default:
      return <span style={{ color: 'white' }}>{token.word}</span>;
  }
};

export const DiffView: React.FC<DiffViewProps> = ({
  text1,
  text2,
  label1 = 'Version A',
  label2 = 'Version B',
}) => {
  const { diff1, diff2 } = diffTexts(text1, text2);

  return (
    <div className="flex gap-4 h-full bg-[#0d1117] text-[#e6edf3] p-4">
      {/* Left Panel - Text 1 */}
      <div className="flex-1 flex flex-col">
        <div className="text-xs font-semibold text-[#8b949e] mb-3 uppercase tracking-wider">
          {label1}
        </div>
        <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded p-4 overflow-y-auto">
          <div className="text-sm leading-relaxed flex flex-wrap gap-1">
            {diff1.map((token, idx) => (
              <DiffTokenDisplay key={idx} token={token} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Text 2 */}
      <div className="flex-1 flex flex-col">
        <div className="text-xs font-semibold text-[#8b949e] mb-3 uppercase tracking-wider">
          {label2}
        </div>
        <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded p-4 overflow-y-auto">
          <div className="text-sm leading-relaxed flex flex-wrap gap-1">
            {diff2.map((token, idx) => (
              <DiffTokenDisplay key={idx} token={token} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
