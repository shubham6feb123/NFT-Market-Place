import React from "react";

const Button = (props) => {
  return (
    <div
      className="chip-root makeStyles-chipBlue-108 chip-clickable"
      onClick={props.handleClick}
    >
      <span className="form-chip-label">{props.text}</span>
    </div>
  );
};

export default Button;
