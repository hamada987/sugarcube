exports.createPages = async ({actions: {createPage}, graphql}) => {
  createPage({
    path: "/plugins",
    component: require.resolve("./src/templates/plugins.tsx"),
  });

  const mdDocument = require.resolve("./src/templates/markdown-document.tsx");

  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      return Promise.reject(result.errors);
    }

    result.data.allMarkdownRemark.edges.forEach(({node}) => {
      createPage({
        path: node.frontmatter.path,
        component: mdDocument,
        context: {},
      });
    });
  });
};
