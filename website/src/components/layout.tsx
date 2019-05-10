import {Location} from "@reach/router";
import React from "react";

import Footer from "./footer";
import Header from "./header";

const Layout = ({children}) => {
  return (
    <div>
      <Location>{({location}) => <Header location={location} />}</Location>
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
