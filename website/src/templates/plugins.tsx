import {Link, graphql} from "gatsby";
import React from "react";

export default function Plugins({data}) {
  const {totalCount, edges} = data.allMarkdownRemark;

  return (
    <div>
      <h1>Plugins</h1>
      <p>{totalCount} plugins available</p>
      <ul>
        {edges.map(({node}) => (
          <li key={node.id}>
            <Link to={node.frontmatter.path}>{node.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </div>
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
