import "./header.css";

import {Link} from "gatsby";
import React from "react";

interface Props {
  location: Location;
}

const Header = ({location}: Props) => {
  const activeClass = "bb nav-link-active";
  const isTutorialLocation = /^\/tutorial/.test(location.pathname);
  const isPluginsLocation = /^\/plugins/.test(location.pathname);

  return (
    <header className="cf ttu f6 ph2-ns flex-ns justify-between items-center bg-light-primary-color primary-color">
      <h1 className="f3 w-100 w-40-ns pa2">
        <Link className="link nowrap ma2 b black" to="/">
          SugarCube Tools
        </Link>
      </h1>
      <nav className="w-100 w-60-ns pa2-ns">
        <ul className="list fr">
          <li className="ma2-ns ma1 dib" />
          <li className="ma2-ns ma1 dib">
            <Link
              className={`link nowrap ma2 pb1 b black ${
                isTutorialLocation ? activeClass : "hover-nav-link"
              }`}
              to="/tutorial"
            >
              Tutorial
            </Link>
          </li>
          <li className="ma2-ns ma1 dib">
            <Link
              className={`link nowrap ma2 pb1 b black ${
                isPluginsLocation ? activeClass : "hover-nav-link"
              }`}
              to="/plugins"
            >
              Plugins
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
