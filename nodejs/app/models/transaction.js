"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;

var Dict = require('../controllers/dict');

/**
 * Transaction Schema
 */
var TransactionSchema = new Schema({
    date_transaction: {type: Date, default: Date.now},
    bank: {
        id: {type: Schema.Types.ObjectId, ref: 'Bank'},
        libelle: String
    },
    bill: {
      id:  {type: Schema.Types.ObjectId, ref: 'bill'},
      name: String
    },
    value: {type: Date, default: Date.now},
    type_transaction: {type: String, default: "NONE"},
    number: Number,
    description: String,
    third_party: {
        id: {type: Schema.Types.ObjectId, ref: 'Societe'},
        name: String
    },
    debit: {type: Number, default: null },
    credit: {type: Number, default: null },
    number_check_transaction: String,
    transmitter: String,
    bank_check: String,
    bank_statement: Number,
    author: {
        id: {type: String, ref: 'User'},
        name: String
    },
    category:{
        id: {type: Schema.Types.ObjectId, ref: 'BankCategory'},
        name: String
    },
    reconciled: Boolean
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

var transTypeList = {};

Dict.dict({dictName: "fk_transaction_type", object: true}, function (err, docs) {
    
    transTypeList = docs;
});

TransactionSchema.virtual('trans_type').get(function () {
    
    var trans_type = {};
    var transaction_type = this.type_transaction;

    if (transaction_type && transTypeList.values[transaction_type] && transTypeList.values[transaction_type].label) {
            trans_type.id = transaction_type;
            trans_type.name = transTypeList.values[transaction_type].label;
            trans_type.css = transTypeList.values[transaction_type].cssClass;
    } else { // By default
            trans_type.id = transaction_type;
            trans_type.name = transaction_type;
            trans_type.css = "";
    }
       
    return trans_type;
});

TransactionSchema.virtual('amount').get(function(){
    
    if(this.credit)
        return this.credit;
    if(this.debit)
        return (-1 * this.debit);        
});

mongoose.model('Transaction', TransactionSchema);