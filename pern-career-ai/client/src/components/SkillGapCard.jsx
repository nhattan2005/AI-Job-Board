import React from 'react';

const SkillGapCard = ({ skill }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold">{skill.skill}</h3>
      <p className={`text-sm ${skill.status === 'Missing' ? 'text-red-500' : 'text-yellow-500'}`}>
        Status: {skill.status}
      </p>
      <p className="text-sm">Priority: {skill.priority}</p>
    </div>
  );
};

export default SkillGapCard;