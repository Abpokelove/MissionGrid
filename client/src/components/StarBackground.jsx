import React, { useEffect, useState } from 'react';

const StarBackground = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate star coordinates & properties once
    const starArray = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      starArray.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        opacity: Math.random() * 0.7 + 0.3,
        duration: `${Math.random() * 4 + 2}s`,
      });
    }
    setStars(starArray);
  }, []);

  return (
    <div className="stars-bg">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--opacity': star.opacity,
            '--duration': star.duration,
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;
