'use strict';

const fixtures     = require('devhouse-fixtures'),
      fixturesPath = '',
      fs           = require('fs');


function loadFixtures(connectionString) {
  let camelCase = /[a-z]+|[A-Z][a-z]+/g;

  return new Promise((resolve, reject) => {

    return fs.readdir(fixturesPath, (error, files) => {
      return files.map((file) => {
        return file.match(camelCase)
          .map((str) => str.toLowerCase())
          .join('-');
      });
    })
      .then((files) => {
        return Promise.all(files.map((file) => {
          fixtures.load(require(`${file}`), connectionString);
        }));
      })
      .then((data) => {
        return resolve(data);
      })
      .catch((error) => {
        return reject(error);
      });

  });
}

function updateFixtures() {

  return new Promise((resolve, reject) => {

  });

}

module.exports = {
  loadFixtures,
  updateFixtures
};
