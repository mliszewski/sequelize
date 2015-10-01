'use strict';

/* jshint -W030 */
/* jshint -W110 */
var chai = require('chai')
  , expect = chai.expect
  , Support = require(__dirname + '/../support')
  , DataTypes = require(__dirname + '/../../../lib/data-types')
  , current = Support.sequelize;
var SCHEMA_ONE = 'schema_one';
var SCHEMA_TWO = 'schema_two';

var locationId;

describe(Support.getTestDialectTeaser('Model'), function() {
  if (current.dialect.supports.schemas) {

    describe('schemas', function() {
      before(function() {
        this.Restaurant = current.define('restaurant', {
            foo: DataTypes.STRING,
            bar: DataTypes.STRING
          },
          {tableName: "restaurants"});
        this.Location = current.define('location', {
            name: DataTypes.STRING
          },
          {tableName: "locations"});
        this.Employee = current.define('employee', {
            first_name: DataTypes.STRING,
            last_name: DataTypes.STRING
          },
          {tableName: "employees"});
        this.EmployeeOne = this.Employee.schema(SCHEMA_ONE);
        this.EmployeeTwo = this.Employee.schema(SCHEMA_TWO);
        this.Restaurant.belongsTo(this.Location,
          {
            foreignKey: 'location_id',
            constraints: false
          });
        this.Employee.belongsTo(this.Restaurant,
          {
            foreignKey: 'restaurant_id',
            constraints: false
          });
        this.Restaurant.hasMany(this.Employee, {
          foreignKey: 'restaurant_id',
          constraints: false
        });
        this.RestaurantOne = this.Restaurant.schema(SCHEMA_ONE);
        this.RestaurantTwo = this.Restaurant.schema(SCHEMA_TWO);
      });


      beforeEach('build restaurant tables', function() {
        var self = this;
        return current.createSchema('schema_one').then(function() {
          return current.createSchema('schema_two');
        }).then(function() {
          return self.RestaurantOne.sync({force: true});
        }).then(function() {
          return self.RestaurantTwo.sync({force: true});
        }).catch(function(err) {
          expect(err).to.be.null;
        });
      });

      afterEach('drop schemas', function() {
        return current.dropSchema('schema_one').then(function() {
          return current.dropSchema('schema_two');
        });
      });

      describe('Add data via model.create, retrieve via model.findOne', function() {
        it('should be able to insert data into the table in schema_one using create', function() {
          var self = this;
          var restaurantId;

          return self.RestaurantOne.create({
            foo: 'one',
            location_id: locationId
          }).then(function() {
              return self.RestaurantOne.findOne({
                where: {foo: 'one'}});
            }).then(function(obj) {
              expect(obj).to.not.be.null;
              expect(obj.foo).to.equal('one');
              restaurantId = obj.id;
              return self.RestaurantOne.findById(restaurantId);
            }).then(function(obj) {
              expect(obj).to.not.be.null;
              expect(obj.foo).to.equal('one');
            });
        });

        it('should fail to insert data into schema_two using create', function() {
          var self = this;

          return self.RestaurantTwo.create({
            foo: 'test'
          }).catch(function(err) {
            expect(err).to.not.be.null;
          });
        });

        it('should be able to insert data into the table in schema_two using create', function() {
          var self = this;
          var restaurantId;

          return self.RestaurantTwo.create({
            foo: 'two',
            location_id: locationId
          }).then(function() {
              return self.RestaurantTwo.findOne({
                where: {foo: 'two'}});
            }).then(function(obj) {
              expect(obj).to.not.be.null;
              expect(obj.foo).to.equal('two');
              restaurantId = obj.id;
              return self.RestaurantTwo.findById(restaurantId);
            }).then(function(obj) {
              expect(obj).to.not.be.null;
              expect(obj.foo).to.equal('two');
            });
        });


        it('should fail to find schema_one object in schema_two', function() {
          var self = this;

          return self.RestaurantTwo.findOne({where: {foo: 'one'}}).then(function(RestaurantObj) {
            expect(RestaurantObj).to.be.null;
          });
        });

        it('should fail to find schema_two object in schema_one', function() {
          var self = this;

          return self.RestaurantOne.findOne({where: {foo: 'two'}}).then(function(RestaurantObj) {
            expect(RestaurantObj).to.be.null;
          });
        });
      });

      describe('Add data via instance.save, retrieve via model.findAll', function() {
        it('should be able to insert data into both schemas using instance.save and retrieve it via findAll', function() {
          var self = this;

          var restaurauntModel = self.RestaurantOne.build({bar: 'one.1'});

          return restaurauntModel.save()
            .then(function() {
              restaurauntModel = self.RestaurantOne.build({bar: 'one.2'});
              return restaurauntModel.save();
            }).then(function() {
              restaurauntModel = self.RestaurantTwo.build({bar: 'two.1'});
              return restaurauntModel.save();
            }).then(function() {
              restaurauntModel = self.RestaurantTwo.build({bar: 'two.2'});
              return restaurauntModel.save();
            }).then(function() {
              restaurauntModel = self.RestaurantTwo.build({bar: 'two.3'});
              return restaurauntModel.save();
            }).then(function() {
              return self.RestaurantOne.findAll();
            }).then(function(restaurantsOne) {
              expect(restaurantsOne).to.not.be.null;
              expect(restaurantsOne.length).to.equal(2);
              restaurantsOne.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('one');
              });
              return self.RestaurantOne.findAndCountAll();
            }).then(function(restaurantsOne) {
              expect(restaurantsOne).to.not.be.null;
              expect(restaurantsOne.rows.length).to.equal(2);
              expect(restaurantsOne.count).to.equal(2);
              restaurantsOne.rows.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('one');
              });
              return self.RestaurantTwo.findAll();
            }).then(function(restaurantsTwo) {
              expect(restaurantsTwo).to.not.be.null;
              expect(restaurantsTwo.length).to.equal(3);
              restaurantsTwo.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('two');
              });
              return self.RestaurantTwo.findAndCountAll();
            }).then(function(restaurantsTwo) {
              expect(restaurantsTwo).to.not.be.null;
              expect(restaurantsTwo.rows.length).to.equal(3);
              expect(restaurantsTwo.count).to.equal(3);
              restaurantsTwo.rows.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('two');
              });
            });
        });
      });

      describe('Add data via instance.save, retrieve via model.count and model.find', function() {
        it('should be able to insert data into both schemas using instance.save count it and retrieve it via findAll with where', function() {
          var self = this;

          var restaurauntModel = self.RestaurantOne.build({bar: 'one.1'});

          return restaurauntModel.save().then(function() {
            restaurauntModel = self.RestaurantTwo.build({bar: 'two.1'});
            return restaurauntModel.save();
          }).then(function() {
            restaurauntModel = self.RestaurantOne.build({bar: 'one.2'});
            return restaurauntModel.save();
          }).then(function() {
            restaurauntModel = self.RestaurantTwo.build({bar: 'two.2'});
            return restaurauntModel.save();
          }).then(function() {
            restaurauntModel = self.RestaurantTwo.build({bar: 'two.3'});
            return restaurauntModel.save();
          }).then(function() {
            return self.RestaurantOne.findAll({
              where: {bar: {$like: 'one%'}}
            });
          }).then(function(restaurantsOne) {
            expect(restaurantsOne).to.not.be.null;
            expect(restaurantsOne.length).to.equal(2);
            restaurantsOne.forEach(function(restaurant) {
              expect(restaurant.bar).to.contain('one');
            });
            return self.RestaurantOne.count();
          }).then(function(count) {
            expect(count).to.not.be.null;
            expect(count).to.equal(2);
            return self.RestaurantTwo.findAll({
              where: {bar: {$like: 'two%'}}
            });
          }).then(function(restaurantsTwo) {
            expect(restaurantsTwo).to.not.be.null;
            expect(restaurantsTwo.length).to.equal(3);
            restaurantsTwo.forEach(function(restaurant) {
              expect(restaurant.bar).to.contain('two');
            });
            return self.RestaurantTwo.count();
          }).then(function(count) {
            expect(count).to.not.be.null;
            expect(count).to.equal(3);
          });
        });
      });


      describe('Get associated data in public schema via include', function() {
        beforeEach(function() {
          var Location = this.Location;

          return Location.sync({force: true})
            .then(function() {
              return Location.create({name: 'HQ'}).then(function() {
                return Location.findOne({where: {name: 'HQ'}}).then(function(obj) {
                  expect(obj).to.not.be.null;
                  expect(obj.name).to.equal('HQ');
                  locationId = obj.id;
                });
              });
            })
            .catch(function(err) {
              expect(err).to.be.null;
            });
        });

        it('should be able to insert and retrieve associated data into the table in schema_one', function() {
          var self = this;

          return self.RestaurantOne.create({
            foo: 'one',
            location_id: locationId
          }).then(function() {
            return self.RestaurantOne.findOne({
              where: {foo: 'one'}, include: [{
                model: self.Location, as: 'location'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.foo).to.equal('one');
            expect(obj.location).to.not.be.null;
            expect(obj.location.name).to.equal('HQ');
          });
        });


        it('should be able to insert and retrieve associated data into the table in schema_two', function() {
          var self = this;

          return self.RestaurantTwo.create({
            foo: 'two',
            location_id: locationId
          }).then(function() {
            return self.RestaurantTwo.findOne({
              where: {foo: 'two'}, include: [{
                model: self.Location, as: 'location'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.foo).to.equal('two');
            expect(obj.location).to.not.be.null;
            expect(obj.location.name).to.equal('HQ');
          });
        });
      });


      describe('Get schema specific associated data via include', function() {
        beforeEach(function() {
          var Employee = this.Employee;
          return Employee.schema(SCHEMA_ONE).sync({force: true})
            .then(function() {
              return Employee.schema(SCHEMA_TWO).sync({force: true});
            })
            .catch(function(err) {
              expect(err).to.be.null;
            });
        });

        it('should be able to insert and retrieve associated data into the table in schema_one', function() {
          var self = this;
          var restaurantId;

          return self.RestaurantOne.create({
            foo: 'one'
          }).then(function() {
            return self.RestaurantOne.findOne({
              where: {foo: 'one'}
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.foo).to.equal('one');
            restaurantId = obj.id;
            return self.EmployeeOne.create({
              first_name: 'Restaurant',
              last_name: 'one',
              restaurant_id: restaurantId
            });
          }).then(function() {
            return self.RestaurantOne.findOne({
              where: {foo: 'one'}, include: [{
                model: self.EmployeeOne, as: 'employees'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.employees).to.not.be.null;
            expect(obj.employees.length).to.equal(1);
            expect(obj.employees[0].last_name).to.equal('one');
            console.log('TEST');
            return obj.getEmployees({schema:SCHEMA_ONE});
          }).then(function(employees) {
            expect(employees.length).to.equal(1);
            expect(employees[0].last_name).to.equal('one');
            return self.EmployeeOne.findOne({
              where: {last_name: 'one'}, include: [{
                model: self.RestaurantOne, as: 'restaurant'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.restaurant).to.not.be.null;
            expect(obj.restaurant.foo).to.equal('one');
            return obj.getRestaurant({schema:SCHEMA_ONE});
          }).then(function(restaurant) {
            expect(restaurant).to.not.be.null;
            expect(restaurant.foo).to.equal('one');
          });
        });


        it('should be able to insert and retrieve associated data into the table in schema_two', function() {
          var self = this;
          var restaurantId;

          return self.RestaurantTwo.create({
            foo: 'two'
          }).then(function() {
            return self.RestaurantTwo.findOne({
              where: {foo: 'two'}
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.foo).to.equal('two');
            restaurantId = obj.id;
            return self.Employee.schema(SCHEMA_TWO).create({
              first_name: 'Restaurant',
              last_name: 'two',
              restaurant_id: restaurantId
            });
          }).then(function() {
            return self.RestaurantTwo.findOne({
              where: {foo: 'two'}, include: [{
                model: self.Employee.schema(SCHEMA_TWO), as: 'employees'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.employees).to.not.be.null;
            expect(obj.employees.length).to.equal(1);
            expect(obj.employees[0].last_name).to.equal('two');
            return obj.getEmployees({schema:SCHEMA_TWO});
          }).then(function(employees) {
            expect(employees.length).to.equal(1);
            expect(employees[0].last_name).to.equal('two');
            return self.Employee.schema(SCHEMA_TWO).findOne({
              where: {last_name: 'two'}, include: [{
                model: self.RestaurantTwo, as: 'restaurant'
              }]
            });
          }).then(function(obj) {
            expect(obj).to.not.be.null;
            expect(obj.restaurant).to.not.be.null;
            expect(obj.restaurant.foo).to.equal('two');
            return obj.getRestaurant({schema:SCHEMA_TWO});
          }).then(function(restaurant) {
            expect(restaurant).to.not.be.null;
            expect(restaurant.foo).to.equal('two');
          });
        });
      });

      describe('concurency tests', function() {
        it('should build and persist instances to 2 schemas concurrently in any order', function() {
          var Restaurant = this.Restaurant;

          var restaurauntModelSchema1 = Restaurant.schema(SCHEMA_ONE).build({bar: 'one.1'});
          var restaurauntModelSchema2 = Restaurant.schema(SCHEMA_TWO).build({bar: 'two.1'});

          return restaurauntModelSchema1.save()
            .then(function() {
              restaurauntModelSchema1 = Restaurant.schema(SCHEMA_ONE).build({bar: 'one.2'});
              return restaurauntModelSchema2.save();
            }).then(function() {
              return restaurauntModelSchema1.save();
            }).then(function() {
              return Restaurant.schema(SCHEMA_ONE).findAll();
            }).then(function(restaurantsOne) {
              expect(restaurantsOne).to.not.be.null;
              expect(restaurantsOne.length).to.equal(2);
              restaurantsOne.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('one');
              });
              return Restaurant.schema(SCHEMA_TWO).findAll();
            }).then(function(restaurantsTwo) {
              expect(restaurantsTwo).to.not.be.null;
              expect(restaurantsTwo.length).to.equal(1);
              restaurantsTwo.forEach(function(restaurant) {
                expect(restaurant.bar).to.contain('two');
              });
            });
        });
      });
    });
  }
});
