import React from 'react';

const CareerRoadmap = ({ roadmap }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold">Career Roadmap</h2>
      <div className="space-y-4">
        {roadmap.map((phase, index) => (
          <div key={index} className="bg-white shadow-md rounded p-4">
            <h3 className="font-semibold">{phase.phase}</h3>
            <ul className="list-disc pl-5">
              {phase.actions.map((action, actionIndex) => (
                <li key={actionIndex} className="mt-1">
                  <span className={`inline-block px-2 py-1 text-sm font-semibold text-white rounded ${action.type === 'Learn' ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {action.type}
                  </span>
                  <span className="ml-2">{action.content}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerRoadmap;