"use client";

import React, { useState } from "react";

interface HoverableCardProps {
  imageLink: string;
  title: string;
  content: string;
}

const HoverableCard: React.FC<HoverableCardProps> = ({
  imageLink,
  title,
  content,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-full relative bg-white shadow-md rounded-md transition-width duration-300"
      style={{
        width: isHovered ? "320px" : "250px",
        height: "500px",
        backgroundImage: `url(${imageLink})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        marginRight: isHovered ? "-10px" : "5px",
        marginLeft: isHovered ? "-20px" : "0px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 text-center relative">
        {isHovered ? (
          <div className="text-sm text-white relative z-10">{content}</div>
        ) : (
          <h2 className="text-xl font-semibold text-white relative z-10">{title}</h2>
        )}
      </div>
    </div>
  );
};

export default HoverableCard;

