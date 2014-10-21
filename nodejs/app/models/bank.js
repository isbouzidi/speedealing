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
    type: String,
    country: String,
    name_bank: String,
    number_bank: Number,
    code_counter: String,
    account_number: String,
    iban: String,
    bic: String,
    rib: String,
    domiciliation: String,
    department: {
        zip: String,
	town: String
    },
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
    address_client: {
        address: String,
        zip: String,
	town: String
    },
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
var typeList = {};

Dict.dict({dictName: "fk_account_status", object: true}, function (err, docs) {
    statusList = docs;
});

Dict.dict({dictName: "fk_account_type", object: true}, function (err, docs) {
    typeList = docs;
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

BankSchema.virtual('acc_type').get(function () {

    var acc_type = "";
    var type = this.type;
    
    acc_type = typeList.values[type].label;
    
    return acc_type;
});

mongoose.model('bank', BankSchema);
