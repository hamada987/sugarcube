import {graphql} from "gatsby";
import React from "react";

export default function MarkdownDocument({
  data,
}) {
  const {markdownRemark} = data;
  const {frontmatter, html} = markdownRemark;
  return (
    <div className="blog-post-container">
      <div className="blog-post">
        <h1>{frontmatter.title}</h1>
        <div
          className="blog-post-content"
          dangerouslySetInnerHTML={{__html: html}}
        />
      </div>
    </div>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: {path: {eq: $path}}) {
      html
      frontmatter {
        path
        title
      }
    }
  }
`;
