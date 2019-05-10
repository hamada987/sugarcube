import {Link, graphql} from "gatsby";
import React from "react";

import Layout from "../components/layout";

export default function Plugins({data}) {
  const {totalCount, edges} = data.allMarkdownRemark;

  return (
    <Layout>
      <h1>Plugins</h1>
      <p>{totalCount} plugins available</p>
      <ul>
        {edges.map(({node}) => (
          <li key={node.id}>
            <Link to={node.frontmatter.path}>{node.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/plugins/"}}) {
      totalCount
      edges {
        node {
          id
          html
          frontmatter {
            path
            title
          }
          excerpt
        }
      }
    }
  }
`;
