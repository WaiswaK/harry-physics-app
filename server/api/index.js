const { app, ready } = require("../index");

module.exports = async (req, res) => {
  await ready;
  return app(req, res);
};
