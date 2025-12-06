/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

exports.shorthands = undefined;

exports.up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, '1764950948238_reinit-schema-bigint.up.sql'), 'utf8');
  pgm.sql(sql);
};

exports.down = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, '1764950948238_reinit-schema-bigint.down.sql'), 'utf8');
  pgm.sql(sql);
};