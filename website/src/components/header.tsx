import {Link} from "gatsby";
import React from "react";

const Header = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/tutorial">Tutorial</Link>
        </li>
        <li>
          <Link to="/plugins">Plugins</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
