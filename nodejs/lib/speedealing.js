/**
 * Speedealing library function
 */

"use strict";

exports.do_line_tva = function(line, callback) {
	if (line.qty == null)
		line.qty = 0;
	if (line.tva_tx == null)
		line.tva_tx = 0;
	if (line.remise == null) // remise sur ligne
		line.remise = 0;
	if (line.remise_percent == null) // remise sur total
		line.remise_percent = 0;

	calcul_price_total(line, callback);

};

exports.updateAmounts = function(object, callback) {

	object.total_ht = 0;
	object.total_tva = 0;
	object.total_ttc = 0;

	for (var i=0; i<object.lines.length; i++) {
		//console.log(object.lines[i].total_ht);
		object.total_ht += object.lines[i].total_ht;
		object.total_tva += object.lines[i].total_tva;
		object.total_ttc += object.lines[i].total_ttc;
	}

	callback();
};

function calcul_price_total(line, callback) {

	// initialize total (may be HT or TTC depending on price_base_type)

	var pu = 0;
	if (line.price_base_type === 'HT')
		pu = line.pu_ht;
	else
		pu = line.pu_ttc;

	var tot_sans_remise = pu * line.qty;
	var tot_avec_remise_ligne = tot_sans_remise * (1 - (line.remise / 100));
	var tot_avec_remise = tot_avec_remise_ligne * (1 - (line.remise_percent / 100));

	// initialize result
	line.total_tva = 0;
	line.total_ttc = 0;

	if (line.price_base_type === 'HT') {
		// We work to define prices using the price without tax
		line.total_ht_without_discount = tot_sans_remise;
		line.total_ttc_without_discount = tot_sans_remise * (1 + (line.tva_tx / 100));
		var result8bis = tot_sans_remise * (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.total_vat_without_discount = result8bis - (line.total_ht_without_discount);

		line.total_ht = tot_avec_remise;
		line.total_ttc = tot_avec_remise * (1 + (line.tva_tx / 100)); // Selon TVA NPR ou non
		var result2bis = tot_avec_remise * (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.total_tva = result2bis - (line.total_ht); // Total VAT = TTC - (HT + localtax)

		line.pu_ht = pu;
		line.pu_ttc = pu * (1 + (line.tva_tx / 100)); // Selon TVA NPR ou non
		var result5bis = pu * (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.pu_tva = result5bis - (line.pu_ht);

	} else {
		// We work to define prices using the price with tax
		line.total_ttc_without_discount = tot_sans_remise;
		line.total_ht_without_discount = tot_sans_remise / (1 + (line.tva_tx / 100)); // Selon TVA NPR ou non
		var result6bis = tot_sans_remise / (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.total_vat_without_discount = line.total_ttc_without_discount - (result6bis);

		line.total_ttc = tot_avec_remise;
		line.total_ht = tot_avec_remise / (1 + (line.tva_tx / 100)); // Selon TVA NPR ou non
		var result0bis = tot_avec_remise / (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.total_tva = line.total_ttc - (result0bis); // Total VAT = TTC - HT

		line.pu_ttc = pu;
		line.pu_ht = pu / (1 + (line.tva_tx / 100)); // Selon TVA NPR ou non
		var result3bis = pu / (1 + (line.tva_tx / 100)); // Si TVA consideree normale (non NPR)
		line.pu_tva = line.pu_ttc - result3bis;
	}

	//If price is 'TTC' we need to have the totals without VAT for a correct calculation
	if (line.price_base_type === 'TTC') {
		tot_sans_remise = tot_sans_remise / (1 + (line.tva_tx / 100));
		tot_avec_remise = tot_avec_remise / (1 + (line.tva_tx / 100));
	}

	callback(line);

}