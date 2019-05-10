import React from "react";

interface Props {
  title: string;
  description: string;
  path?: string;
}

const IntroCard = ({title, description, path}: Props) => {
  return (
    <div className="flex flex-column justify-around w-third ma3 mh4-ns pa2 outline">
      <h3 className="center">{title}</h3>
      <p className="i">{description}</p>
      <p className="i fr mb2 mt0">
        {path == null ? (
          "Coming Soon."
        ) : (
          <a href={path} className="link">
            Find out more ...
          </a>
        )}
      </p>
    </div>
  );
};

export default IntroCard;
