'use strict';

/* jshint -W030 */
var chai = require('chai')
  , expect = chai.expect
  , Support   = require(__dirname + '/../support')
  , current   = Support.sequelize;

describe(Support.getTestDialectTeaser('Model'), function() {
  if (current.dialect.supports.schemas) {
    var Project = current.define('project'),
      Company = current.define('company', {}, {
        schema: 'default'
      });

    describe('.schema', function() {
      it('should work with no default schema', function() {
        expect(Project.$schema).to.be.null;
      });

      it('should apply default schema', function() {
        expect(Company.$schema).to.equal('default');
      });

      it('should be able to override the default schema', function() {
        expect(Company.schema('newSchema').$schema).to.equal('newSchema');
      });

      it('should be able nullify schema', function() {
        expect(Company.schema(null).$schema).to.be.null;
      });

      it('should support multiple, coexistent schema models', function() {
        var schema1 = Company.schema('schema1')
          , schema2 = Company.schema('schema1');

        expect(schema1.$schema).to.equal('schema1');
        expect(schema2.$schema).to.equal('schema1');
      });
    });
  }
});
