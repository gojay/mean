'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var glob = require('glob');

var Product = require('./product.model');
var Category = require('../category/category.model');
var config = require('../../config/environment');

function getLocalImages(name) {
    var pattern = config.root + '/client/images/phones/*'+ name +'*';
    return glob.sync(pattern);
}

describe('Model : Product :', function() {
    this.timeout(30000);

    var productId;

    before(function(done) {
        Category.remove(function() {
          Product.remove(function() {
            request(app)
              .post('/api/seeds/category/product')
              .expect(201, done);
          });
        });
    });

    it('should begin with no products', function(done) {
        Product.find({}, function(err, products) {
            if (err) return done(err);
            products.should.have.length(0);
            done();
        })
    });

    it('should fail when save product without category', function(done) {
        var product = new Product();
        product.title = 'Test';
    	product.save(function(err){
    		should.exist(err);
    		done();
    	});
    });

    it.skip('should product saved and images uploaded and the count of the relevant category has increased', function(done) {
        var category = 'netbooks';
        var path = config.root + '/assets/phones/';
        var images = [
            path + 'dell-streak-7.0.jpg',
            path + 'dell-streak-7.1.jpg',
            path + 'dell-streak-7.2.jpg',
            path + 'dell-streak-7.3.jpg',
            path + 'dell-streak-7.4.jpg'
        ];

        // save phone
        var product = new Product();
        product.title = 'Test';
        product.category = category;
        product.uploadAndSave(images, function(err, product) {
            should.not.exist(err);
            should.exist(product);

            product.should.have.properties('_id', 'meta');
            product.meta.images.files.should.have.lengthOf(5);
            product.meta.images.cdnUri.should.be.equal('/images/phones');
            productId = product._id;

            var images = getLocalImages('dell-streak');
            images.should.be.an.instanceOf(Array).and.have.lengthOf(10); // preview & original

            /*
            check categories count
            ----------------------
            this category = 1
            this parent category ('mobile-phones') = 1
            this root category ('products') = 1
            */
            Category.findById(category, function(err, category) {
                category.should.containEql({ count: 1 });
                category.getAncestors({}, "_id, count", function(err, categories) {
                    categories.should.containDeep([{
                        _id: 'products',
                        count: 1
                    }]).and.containDeep([{
                        _id: 'electronics',
                        count: 1
                    }]);
                    done();
                });
            });
        });
    });

    it.skip('should product edited and the count of the relevant category has increased', function(done) {
        var category = 'laptops';
        Product.findById(productId, function(err, product) {
            product.category = category;
            product.save(function(err) {
                should.not.exist(err);

                /*
                check categories count
                ----------------------
                this category = 1
                this parent category ('electronics') = 1
                this root category ('products') = 1
                */
               setTimeout(function() {
                    Category.findById(product.category, function(err, category) {
                        category.should.containEql({ count: 1 });
                        category.getAncestors({}, "_id, count", function(err, categories) {
                        console.log('edited...')
                            categories.should.containDeep([{
                                _id: 'products',
                                count: 1
                            }]).and.containDeep([{
                                _id: 'electronics',
                                count: 1
                            }]);
                            done();
                        });
                    });
                });
            })
        })
    });

    it.skip('should product removed and images is empty', function(done) {
        var category = 'laptops';
        Product.findById(productId, function(err, product) {
            product.remove(function(err) {
                should.not.exist(err);

                var images = getLocalImages('dell-streak');
                images.should.have.lengthOf(0);

                /*
                check categories count
                ----------------------
                this category = 0
                this parent category ('electronics') = 0
                this root category ('products') = 0
                */
                Category.findById(category, function(err, category) {
                    category.should.containEql({ count: 0 });
                    category.getAncestors({}, "_id, count", function(err, categories) {
                        categories.should.containDeep([{
                            _id: 'products',
                            count: 0
                        }]).and.containDeep([{
                            _id: 'electronics',
                            count: 0
                        }]);
                        done();
                    });
                });
            });
        });
    });

    describe('filters :', function() {
    	var query, filters;
    	beforeEach(function() {
    		query = {
    			all: 'aria',
    			category: "mobile-phones",
			    brand: [
			        "at-t",
			        "blackberry"
			    ],
    			os: 'android+2.1',
    			display: {
    				gte: 3,
    				lte: 4
    			},
    			flash: {
    				gte: 256,
    				lte: 512
    			},
    			ram: {
    				gte: 256,
    				lte: 512
    			},
    			camera: {
    				lt: "5"
    			},
			    price: {
			        gte: "0",
			        lte: "228"
			    }
    		};
    		filters = Product.buildFilters({ q:query });
    	});

    	it('should filters exist', function(done) {
    		should.exist(filters);
    		done();
    	});

        describe('$match', function() {
            var $match;
            beforeEach(function() {
                $match = filters.match;
            });

            it('should $or defined and expected', function(done) {
                var expect = [  
                    { title: { '$regex': 'Aria', '$options': 'i' } },
                    { body: { '$regex': 'Aria', '$options': 'i' } },
                    { 'meta.description': { '$regex': 'Aria', '$options': 'i' } } 
                ];
                $match.should.have.ownProperty('$or').containDeep(expect);
                done();
            });

            it('should $match category defined and expected', function(done) {
                $match.should.have.ownProperty('category').equal('mobile-phones');
                done();
            });

            it('should $match brand defined and expected', function(done) {
                $match.should.have.ownProperty('brand').containDeep({ $in: [/At t/i, /Blackberry/i] });
                done();
            });

            it('should $match os defined and expected', function(done) {
                $match.should.have.ownProperty('meta.android.os').containDeep({ $regex: 'Android+2.1', $options: 'i' });
                done();
            });

            it('should $match display defined and expected', function(done) {
                var expect = { $gte: 3, $lte: 4 };
                $match.should.have.hasOwnProperty('meta.display.screenSize').containDeep(expect);
                done();
            });

            it('should $match flash defined and expected', function(done) {
                var expect = { $gte: 256, $lte: 512 };
                $match.should.have.hasOwnProperty('meta.storage.flash').containDeep(expect);
                done();
            });

            it('should $match ram defined and expected', function(done) {
                var expect = { $gte: 256, $lte: 512 };
                $match.should.have.hasOwnProperty('meta.storage.ram').containDeep(expect);
                done();
            });

            it('should $match camera defined and expected', function(done) {
                var expect = { $lt: 5 };
                $match.should.have.hasOwnProperty('meta.camera.primary').containDeep(expect);
                done();
            });

            it('should $match price defined and expected', function(done) {
                var expect = { $gte: 0, $lte: 228 };
                $match.should.have.hasOwnProperty('price').containDeep(expect);
                done();
            });
        });

        it('should filters $match operator is $and', function(done) {
            var newQuery = query;
            newQuery.operator = 'and';
            var newFilters = Product.buildFilters({ q:newQuery });
            newFilters.match.should.have.property('$and');
            done();
        });

        it('should filters $match operator is $or as default, if operator not supported', function(done) {
            var newQuery = query;
            newQuery.operator = 'xxx';
            var newFilters = Product.buildFilters({ q:query });
            newFilters.match.should.have.property('$or');
            done();
        });

        it('should filters sort is defined and expected', function(done) {
            var newFilters = Product.buildFilters({ q:query, sort: '-createdAt' });
            newFilters.should.have.ownProperty('sort').containDeep({ 'data.createdAt': -1 });
            done();
        });

        it('should filters multiple sort expected', function(done) {
            var newFilters = Product.buildFilters({ q:query, sort: '-createdAt|-reviews' });
            newFilters.should.have.ownProperty('sort').containDeep({ 'data.createdAt': -1, 'data.reviews': -1 });
            done();
        });

        it('should filters limit & sort are expected', function(done) {
            var newFilters = Product.buildFilters({ q:query, page: 2 });
            newFilters.should.have.property('limit', 12);
            newFilters.should.have.property('skip', 12);
            done();
        });
    });

    describe('statics :', function() {
        var query = {
            q: {
                body: "motorola",
                category: "android",
                brand: "motorola",
                price: {
                    gte: "500",
                    lte: "1000"
                },
                sort: "-price|-review"
            }
        };

        it('should getFilters without query', function(done) {
            Product.getFilters({}, function(err, filters) {
                should.not.exist(err);
                filters.should.be.and.instanceOf(Object).and.have.properties('filters', 'category', 'display', 'brands', 'flash', 'price', 'ram', 'os', 'camera');
                done();
            });
        });

        it('should getFilters with query', function(done) {
            Product.getFilters(query, function(err, filters) {
                should.not.exist(err);
                filters.should.be.and.instanceOf(Object).and.have.properties('filters', 'category', 'display', 'brands', 'flash', 'price', 'ram', 'os', 'camera');
                done();
            });
        });

        it('should list without query', function(done) {
            Product.list({}, function(err, products) {
                should.not.exist(err);
                products.should.be.and.instanceOf(Object).and.have.properties('data', 'total', 'limit', 'pages', 'perPage', 'currentPage');
                products.data.should.be.an.instanceOf(Array);
                done()
            });
        });

        it('should list with query', function(done) {
            Product.list(query, function(err, products) {
                should.not.exist(err);
                products.should.be.and.instanceOf(Object).and.have.properties('data', 'total', 'limit', 'pages', 'perPage', 'currentPage');
                products.data.should.be.an.instanceOf(Array);
                done()
            });
        });
    });

    after(function(done) {
    	// Category.remove(function() {
        	Product.remove(done);
    	// });
    });
});
