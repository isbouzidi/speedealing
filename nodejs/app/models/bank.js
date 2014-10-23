/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;

var Dict = require('../controllers/dict');

/**
 * Bank Schema
 */
var BankSchema = new Schema({
    ref: String,
    libelle: String,
    account_type: String,
    country:  String,
    name_bank: String,
    code_bank: Number,
    number_bank: Number,
    code_counter: String,
    account_number: String,
    iban: String,
    bic: String,
    rib: String,
    currency: String,
    status: String,
    accounting_code: String,
    rapprochable: Boolean,
    initial_balance: Number,
    min_balance_allowed: Number,
    min_balance_required: Number,
    web: String,
    client: {
        id: {type: Schema.Types.ObjectId, ref: 'Societe'},
        name: String
    },
    address: String,
    zip: String,
    town: String,
    comment: String,
    author: {
        id: {type: String, ref: 'User'},
        name: String
    }
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

var statusList = {};

Dict.dict({dictName: "fk_account_status", object: true}, function (err, docs) {
    statusList = docs;
});

BankSchema.virtual('acc_status').get(function () {
    var acc_status = {};

    var status = this.status;

    if (status && statusList.values[status] && statusList.values[status].label) {
            acc_status.id = status;
            acc_status.name = statusList.values[status].label;
            acc_status.css = statusList.values[status].cssClass;
    } else { // By default
            acc_status.id = status;
            acc_status.name = status;
            acc_status.css = "";
    }
    return acc_status;
});

var typeList = {};

Dict.dict({dictName: "fk_account_type", object: true}, function (err, docs) {
    
    typeList = docs;
});

BankSchema.virtual('acc_type').get(function () {
    
    var acc_type = {};
    var account_type = this.account_type;
    
//    if(account_type)
//       acc_type = typeList.values[account_type].label;

    if (account_type && typeList.values[account_type] && typeList.values[account_type].label) {
            acc_type.id = account_type;
            acc_type.name = typeList.values[account_type].label;
            acc_type.css = typeList.values[account_type].cssClass;
    } else { // By default
            acc_type.id = account_type;
            acc_type.name = account_type;
            acc_type.css = "";
    }
       
    return acc_type;
});

var countryList = {};

Dict.dict({dictName: "fk_country", object: true}, function (err, docs) {
    
    countryList = docs;
});

BankSchema.virtual('acc_country').get(function () {
    
    var acc_country = "";
    var account_country = this.country;
    
    if(account_country)
       acc_country = countryList.values[account_country].label;  
       
    return acc_country;
});

mongoose.model('bank', BankSchema);
