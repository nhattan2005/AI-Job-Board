import React, { useState } from 'react';
import { generateCareerPath } from '../services/api';

const CareerPath = () => {
  const [cvText, setCvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await generateCareerPath(cvText);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <textarea
        className="w-full h-40 p-2 border border-gray-300 rounded"
        placeholder="Paste your CV text here..."
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
      />
      <button
        className={`mt-2 p-2 bg-blue-500 text-white rounded ${loading ? 'opacity-50' : ''}`}
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Career Path'}
      </button>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Career Path Analysis</h2>
          <div className="bg-white shadow-md rounded p-4 mb-4">
            <h3 className="font-semibold">Current Positioning</h3>
            <p>Role: {result.current_positioning.role}</p>
            <p>Level: {result.current_positioning.level}</p>
            <p>Salary Potential: {result.current_positioning.salary_potential}</p>
            <p>Summary: {result.current_positioning.summary}</p>
          </div>
          <div className="bg-white shadow-md rounded p-4 mb-4">
            <h3 className="font-semibold">Skill Gaps</h3>
            {result.skill_gap.map((skill, index) => (
              <div key={index} className="flex justify-between">
                <span>{skill.skill}</span>
                <span className={`badge ${skill.status === 'Missing' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {skill.status}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white shadow-md rounded p-4 mb-4">
            <h3 className="font-semibold">Career Paths</h3>
            {result.paths.map((path, index) => (
              <div key={index} className="mb-2">
                <h4 className="font-bold">{path.name} ({path.match}%)</h4>
                <p>Time: {path.time}</p>
                <p>Pros: {path.pros.join(', ')}</p>
                <p>Cons: {path.cons.join(', ')}</p>
              </div>
            ))}
          </div>
          <div className="bg-white shadow-md rounded p-4">
            <h3 className="font-semibold">Roadmap</h3>
            {result.roadmap.map((phase, index) => (
              <div key={index} className="mb-2">
                <h4 className="font-bold">{phase.phase}</h4>
                <ul>
                  {phase.actions.map((action, actionIndex) => (
                    <li key={actionIndex} className="ml-4">
                      {action.type}: {action.content}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPath;