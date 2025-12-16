import React from 'react';

const PathCard = ({ path }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold">{path.name}</h3>
      <p className="text-gray-600">Match: {path.match}%</p>
      <p className="text-gray-600">Time: {path.time}</p>
      <div className="mt-2">
        <h4 className="font-semibold">Pros:</h4>
        <ul className="list-disc list-inside">
          {path.pros.map((pro, index) => (
            <li key={index} className="text-gray-700">{pro}</li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <h4 className="font-semibold">Cons:</h4>
        <ul className="list-disc list-inside">
          {path.cons.map((con, index) => (
            <li key={index} className="text-gray-700">{con}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PathCard;