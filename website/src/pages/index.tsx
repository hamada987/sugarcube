import "../styles.css";

import React from "react";

import IntroCard from "../components/intro-card";
import Layout from "../components/layout";

const sugarCubeDescription = `
SugarCube is a tool to preserve and monitor data.
`;

const nCubeDescription = `
N-Cube is a set of components to build custom data interfaces for investigators that use SugarCube.
`;

const browserExtensionDescription = `
Imrpove the discovery process of an investigation using this browser extension.
`;

const Index = () => {
  return (
    <Layout>
      <section className="cf ph2-ns pt5 pb5 w-100 flex flex-column items-center justify-around bg-primary-color white">
        <div className="w-80-ns tc center">
          <h1 className="w-100 center">Data pipelines for human rights.</h1>
        </div>
        <p>Helping human rights investigators work with data.</p>
      </section>
      <section className="w-100 flex-ns justify-between-ns mt2">
        <IntroCard
          title="SugarCube"
          description={sugarCubeDescription}
          path="/sugarcube"
        />
        <IntroCard title="N-Cube" description={nCubeDescription} />
        <IntroCard
          title="Browser Extension"
          description={browserExtensionDescription}
        />
      </section>
    </Layout>
  );
};

export default Index;
