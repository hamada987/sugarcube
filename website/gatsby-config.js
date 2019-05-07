module.exports = {
  siteMetadata: {
    siteName: "SugarCube Tools",
    siteUrl:
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000"
        : "https://sugarcubetools.net",
    description: "Documentation for the SugarCube based investigative toolset.",
  },
  plugins: ["gatsby-plugin-typescript", "gatsby-plugin-postcss"],
};
