import {Location} from "@reach/router";
import React from "react";

import Header from "./header";

const Layout = ({children}) => {
  return (
    <div>
      <Location>{({location}) =>
        <Header location={location} />
      }
      </Location>
      {children}
    </div>
  );
};

export default Layout;
