import React from "react";

const Loader = ({ loaderHidden }) => {
  return (
    <div hidden={loaderHidden} className="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Loader;
