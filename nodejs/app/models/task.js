/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		i18n = require("i18next"),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

var Dict = require('../controllers/dict');

/**
 * Article Schema
 */
var taskSchema = new Schema({
	name: String,
	societe: {id: Schema.Types.ObjectId, name: String},
	contact: {id: Schema.Types.ObjectId, name: String},
	datec: {type: Date, default: Date.now}, // date de creation
	datep: Date, // date de debut
	datef: Date, // date de fin
	duration: Number,
	type: String,
	entity: String,
	author: {id: String, name: String},
	usertodo: {id: String, name: String},
	userdone: {id: String, name: String},
	notes: [
		{
			author: {
				id: {type: String, ref: 'User'},
				name: String
			},
			datec: {type: Date, default: Date.now},
			percentage: {type: Number, default: 0},
			note: String
		}
	],
	archived: Boolean
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

taskSchema.plugin(timestamps);

taskSchema.virtual('percentage')
		.get(function () {
			if(this.notes.length == 0)
				return 0;
			
			var last_note = this.notes[this.notes.length - 1];
			
			return last_note.percentage || 0;
		});

function getStatus(status) {
	var res_status = {};

	var taskStatus = {
		"TODO": {
			"enable": true,
			"label": "StatusActionToDo",
			"cssClass": "blue-gradient",
			"dateEnd": "expired"
		},
		"ON": {
			"label": "StatusActionInProcess",
			"enable": true,
			"cssClass": "orange-gradient",
			"dateEnd": "expired"
		},
		"DONE": {
			"enable": true,
			"label": "StatusActionDone",
			"cssClass": "green-gradient"
		},
		"NOTAPP": {
			"label": "StatusNotApplicable",
			"enable": false,
			"cssClass": "grey-gradient"
		},
		"expired": {
			"enable": false,
			"label": "StatusActionTooLate",
			"cssClass": "red-gradient"
		}
	};

	if (status && taskStatus[status] && taskStatus[status].label) {
		//console.log(this);
		res_status.id = status;
		res_status.name = i18n.t("tasks:" + taskStatus[status].label);
		res_status.css = taskStatus[status].cssClass;
	} else { // By default
		res_status.id = status;
		res_status.name = status;
		res_status.css = "";
	}

	return res_status;

}

taskSchema.virtual('status')
		.get(function () {
			
			if(this.notes.length == 0)
				return getStatus("NOTAPP");

			var last_note = this.notes[this.notes.length - 1];
			var percentage = last_note.percentage || 0;
			
			if(percentage >= 100)
				return getStatus("DONE");
			
			if(this.datef < new Date)
				return getStatus("expired");
			
			if (percentage == 0)
				return getStatus("TODO");
			
			return getStatus("ON");
			
		});
		
		
var typeList = {};
Dict.dict({dictName: "fk_actioncomm", object: true}, function (err, docs) {
	if (docs) {
		typeList = docs;
	}
});

taskSchema.virtual('_type')
		.get(function () {
			var _type = {};

			var type = this.type;

			if (type && typeList.values[type] && typeList.values[type].label) {
				_type.id = type;
				_type.name = i18n.t(typeList.lang + ":" + typeList.values[type].label);
			} else { // By default
				_type.id = type;
				_type.name = type;
			}

			return _type;
		});


mongoose.model('task', taskSchema, 'Task');
