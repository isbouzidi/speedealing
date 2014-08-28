/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		async = require('async');

var PriceLevelModel = mongoose.model('pricelevel');
var ProductModel = mongoose.model('product');

exports.read = function(req, res) {
	var query = {};

	if (req.query.price_level)
		query.price_level = req.query.price_level;

	if (req.query.ref) {
		query.product = {};
		query.product.name = req.query.ref;
	}

	if (req.query.qty) {
		query.qtyMin = {'$lte': parseFloat(req.query.qty)};
	}

	console.log(query);

	PriceLevelModel.find(query, "-history", {sort: {qtyMin: -1}})
			.populate("product.id", "label pu_ht")
			.exec(function(err, prices) {
				if (err)
					console.log(err);

				console.log(prices);
				if (prices == null)
					prices = [];

				res.send(200, prices);
			});
};

exports.list = function(req, res) {
	PriceLevelModel.aggregate([{'$group': {_id: '$price_level'}}, {'$sort': {_id: 1}}], function(err, docs) {
		if (err) {
			console.log("err : /api/product/price_level/select");
			console.log(err);
			return;
		}

		var result = [];

		if (docs !== null)
			for (var i in docs) {
				//console.log(docs[i]);
				result[i] = {};
				result[i].name = docs[i]._id;
				//result[i].id = docs[i]._id;
			}

		return res.send(200, result);
	});
};

exports.update = function(req, res) {
	PriceLevelModel.update({_id: req.body._id},
	{
		tms: new Date,
		pu_ht: req.body.pu_ht,
		qtyMin: req.body.qtyMin,
		discount: req.body.discount,
		user_mod: {
			id: req.user._id,
			name: req.user.name
		},
		optional: req.body.optional,
		$addToSet: {
			history: {
				tms: new Date,
				user_mod: {
					id: req.user._id,
					name: req.user.name
				},
				pu_ht: req.body.pu_ht,
				qtyMin: req.body.qtyMin,
				discount: req.body.discount
			}
		}
	},
	{upsert: false},
	function(err, numberAffected, price) {
		if (err)
			return console.log(err);

		//console.log(price);
		res.send(200);
	});
	//console.log(req.body);
};

exports.add = function(req, res) {
	var price = new PriceLevelModel(req.body);

	price.user_mod = {
		id: req.user._id,
		name: req.user.name
	};

	price.history.push({
		tms: new Date,
		user_mod: {
			id: req.user._id,
			name: req.user.name
		},
		pu_ht: req.body.pu_ht,
		qtyMin: req.body.qtyMin,
		discount: req.body.discount
	});

	price.save(function(err, price) {
		if (err)
			return console.log(err);

		//console.log(price);
		res.json(price);
	});
	//console.log(req.body);
};

exports.remove = function(req, res) {
	PriceLevelModel.remove({_id: req.body._id}, function(err) {
		if (err)
			return console.log(err);
		res.send(200);
	});
};

exports.autocomplete = function(body, callback) {
	var query = {
		"product.name": new RegExp(body.filter.filters[0].value, "i"),
		price_level: body.price_level
	};

	PriceLevelModel.find(query, "-history", {limit: body.take})
			.populate("product.id", "label ref minPrice tva_tx caFamily")
			.exec(function(err, prices) {
				if (err) {
					console.log("err : /api/product/price/autocomplete");
					console.log(err);
					return;
				}
				console.log(prices);
				callback(prices);
			});

};

exports.upgrade = function(req, res) {
	ProductModel.find(function(err, products) {
		async.each(products, function(product, callback) {

			for (var i = 0; i < product.price.length; i++) {
				if (product.price[i].price_level === 'BASE')
					ProductModel.update({_id: product._id}, {
						pu_ht: product.price[i].pu_ht,
						tva_tx: product.price[i].tva_tx,
						tms: product.price[i].tms
					},
					{upsert: false},
					function(err, numberAffected, price) {
						if (err)
							return console.log(err);

						//console.log(price);
					});
				else
					PriceLevelModel.update({"product.id": product._id, price_level: product.price[i].price_level, qtyMin: product.price[i].qtyMin},
					{
						product: {
							id: product._id,
							name: product.ref
						},
						price_level: product.price[i].price_level,
						tms: product.price[i].tms,
						pu_ht: product.price[i].pu_ht,
						qtyMin: product.price[i].qtyMin,
						user_mod: product.price[i].user_mod,
						optional: {
							ref_customer_code: product.price[i].ref_customer_code,
							dsf_coef: product.price[i].dsf_coef,
							dsf_time: product.price[i].dsf_time
						},
						$addToSet: {
							history: {
								tms: product.price[i].tms,
								user_mod: product.price[i].user_mod,
								pu_ht: product.price[i].pu_ht,
								qtyMin: product.price[i].qtyMin
							}
						}
					},
					{upsert: true},
					function(err, numberAffected, price) {
						if (err)
							return console.log(err);

						//console.log(price);
					});
			}

			callback();
		}, function(err) {
			if (err)
				return res.json(err);
			res.send(200);
		});
	});
};
