"use strict";

var CommandeModel = mongoose.model('commande');
var ExtrafieldModel = mongoose.model('extrafields');

var PDFDocument = require('pdfkit');
var dateFormat = require('dateformat');

module.exports = function(app, ensureAuthenticated) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Commande', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/commande/lines/list', ensureAuthenticated, function(req, res) {
		object.listLines(req, res);
		return;
	});

	app.get('/api/commande/BL/pdf', ensureAuthenticated, function(req, res) {
		object.genBlPDF(req, res);
		return;
	});

	//other routes..
};

function Object() {
}

Object.prototype = {
	listLines: function(req, res) {
		CommandeModel.findOne({_id: req.query.id}, "lines", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.send(200, doc.lines);
		});
	},
	genBlPDF: function(req, res) {
		CommandeModel.findOne({_id: "526e2736a5209d306d000008"}, function(err, order) {
			if (err || order == null) {
				console.log(err);
				res.send(500, doc);
				return;
			}
			
			var margin = 30;

			var pdf = new PDFDocument({size: 'a4', margin: margin});

			pdf.info['Title'] = "Bon de livraison";
			pdf.info['Author'] = "Speedealing";
			pdf.info['Subject'] = "Bon de livraison";
			pdf.info['Keywords'] = "BL, Chaumeil";
			//pdf.info['CreationDate'] = " - the date the document was created (added automatically by PDFKit)";
			pdf.info['ModDate'] = new Date().toISOString();

			var nbpages = 0;

			//debut page haut
			var posy = 10;
			var posx = 297 - 10 - 100;

			var Xoff = 90;
			var Yoff = 0;

			var tab4_top = 60;
			var $tab4_hl = 6;
			var $tab4_sl = 4;
			var line = 2;
			
			//*********************LOGO****************************
			pdf.image('images/logo.jpg', margin, margin, {fit:[200, 100]});
			
			console.log(order);
	
			pdf.fontSize(16)
				.text('Bon de livraison \nRef. : ' + order.ref_client,margin, margin, {
				width: pdf.page.width - margin*2,
				align: 'right'})
				.fontSize(12)
				.text('Date de commande : ' + dateFormat(order.datec,"dd/mm/yyyy"), margin, 40 + margin, {
				width: pdf.page.width - margin*2,
				align: 'right'});
		
			posy = pdf.y;
		
			pdf.fontSize(10)
				.text("Emetteur", margin, posy + 30);
		
			pdf.fontSize(10)
				.text("Adresse a", margin+250, posy + 30);
		
			pdf.moveDown();
			
			posy = pdf.y;
			
			pdf.rect(margin, posy , 200, 100)
				//.fill('gray')
				.stroke();
			
			pdf.fontSize(12);
			pdf.text("Chaumeil", margin + 10, posy +10);
			pdf.fontSize(10);
			
			pdf.rect(margin + 250, posy , 270, 100)
				.stroke();
			
			pdf.fontSize(11);
			pdf.text(order.client.name, margin + 250 + 10, posy +10,{
				width : 250,
				align: 'justify'});
			pdf.fontSize(10);
			
			
			
			pdf.moveDown();
			
			

/*
			var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar diam eu ' +
					'dolor bibendum et varius diam laoreet. Morbi eget rutrum enim. Sed enim ipsum, ' +
					'posuere nec hendrerit non, commodo quis tortor. Fusce id nisl augue. Fusce at ' +
					'lectus ut libero vehicula imperdiet.';

			pdf.text('This text is left aligned. ' + lorem, 100, 100, {
				width: 410,
				align: 'left'});

			pdf.moveDown();

			pdf.text('This text is centered. ' + lorem, {
				width: 410,
				align: 'center'});

			pdf.moveDown();

			pdf.text('This text is right aligned. ' + lorem, {
				width: 410,
				align: 'right'});

			pdf.moveDown();

			pdf.text('This text is justified. ' + lorem, {
				width: 410,
				align: 'justify'
			});

			pdf.rect(100, 100, 410, pdf.y - 100)
					.stroke();
*/
			//pdf.write('output.pdf');

			pdf.output(function(doc) {
				res.type('pdf');

				res.send(200, new Buffer(doc, 'binary'));
			});


		});
	}
};
