"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp'),
		crypto = require('crypto'),
		authTypes = ['github', 'twitter', 'facebook', 'google'];

var UserGroupModel = mongoose.model('userGroup');
var DictModel = mongoose.model('dict');
var ExtrafieldModel = mongoose.model('extrafields');


/**
 * User Schema
 */
var UserSchema = new Schema({
	_id: String,
	Status: {type: Schema.Types.Mixed, default: 'DISABLE'},
	name: {type: String, required: true},
	email: String,
	admin: Boolean,
	lastname: {type: String, uppercase: true},
	firstname: String,
	provider: String,
	password: String,
	hashed_password: String,
	salt: String,
	entity: String,
	photo: String,
	telMobile: String,
	facebook: {},
	twitter: {},
	github: {},
	google: {
		user_id: String,
		sync: {type: Boolean, default: true}, // authorisation to sync with google
		tokens: {
			access_token: String,
			refresh_token: String
		},
		contacts: {
			latestImport: String, // date format YYYY-MM-DD
			group_href: String 		// group which contains exported contacts
		},
		tasks: {
			tasklist_id: String // tasklist which contains our tasks
		},
		calendar: {
			calendar_id: String // calendar which contains our events
		}
	},
	roles: [String],
	groupe: String,
	rights: mongoose.Schema.Types.Mixed,
	_createdAt: {type: Date},
	LastConnection: Date,
	NewConnection: Date,
	externalConnect: {type: Boolean, default: false},
	right_menu: {type: Boolean, default: true},
	url: String, //url by default after login
	societe: {
		id: {type: Schema.Types.ObjectId, ref: 'Societe'},
		name: String
	},
	multiEntities: {type: Boolean, default: false}, // Access to all entities ?
	telFixe: String,
	address: String,
	zip: String,
	town: String,
	dateNaissance: Date,
	villeNaissance: String,
	paysNaissance: String,
	nationnalite: String,
	situationFamiliale: String,
	nbrEnfants: Number,
	perCharges: Number,
	dateArrivee: Date,
	dateDepart: Date,
	poste: String,
	descriptionPoste: String,
	contrat: String,
	periodeEssai: String,
	salaire: Number,
	tempsTravail: String,
	securiteSociale: Number,
	libelleBank: String,
	iban: String,
	niveauEtude: String,
	anneeDiplome: Number,
	notes: [{
			author: {
				id: {type: String, ref: 'User'},
				name: String
			},
			datec: Date,
			note: String
		}]

},
{
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

UserSchema.plugin(timestamps);

UserSchema.plugin(gridfs.pluginGridFs, {root: "User"});

var statusList = {};
ExtrafieldModel.findOne({_id: "extrafields:User"}, function (err, docs) {

	statusList = docs;
});

UserSchema.virtual('status')
		.get(function () {

			var res_status = {};

			var status = this.Status;

			if (status && statusList.fields["Status"].values[status].label) {
				//console.log(this);
				res_status.id = status;
				//this.status.name = i18n.t("intervention." + statusList.values[status].label);
				res_status.name = statusList.fields["Status"].values[status].label;
				res_status.css = statusList.fields["Status"].values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});

var userGroupList = {};

UserGroupModel.find(function (err, docs) {

	userGroupList = docs;

});

UserSchema.virtual('userGroup')
		.get(function () {

			var group;

			if (this.groupe) {
				for (var j in userGroupList) {
					if (userGroupList[j]._id === this.groupe)
						group = userGroupList[j].name;
				}

			}

			return group;
		});

UserSchema.virtual('fullname').get(function () {

	return this.lastname + ' ' + this.firstname;

});


/**
 * Virtuals
 */
/*UserSchema.virtual('password').set(function(password) {
 this._password = password;
 this.salt = this.makeSalt();
 this.hashed_password = this.encryptPassword(password);
 }).get(function() {
 return this._password;
 });*/

/**
 * Validations
 */
var validatePresenceOf = function (value) {
	return value && value.length;
};

// the below 4 validations only apply if you are signing up traditionally
UserSchema.path('name').validate(function (name) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1)
		return true;
	return name.length;
}, 'Name cannot be blank');

UserSchema.path('email').validate(function (email) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1)
		return true;
	return email.length;
}, 'Email cannot be blank');

UserSchema.path('hashed_password').validate(function (hashed_password) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1)
		return true;
	return hashed_password.length;
}, 'Password cannot be blank');


/**
 * Pre-save hook
 */
UserSchema.pre('save', function (next) {
	if (!this.isNew)
		return next();

	if (!validatePresenceOf(this.password) && authTypes.indexOf(this.provider) === -1)
		next(new Error('Invalid password'));
	else
		next();
});

/**
 * Methods
 */
UserSchema.methods = {
	/**
	 * Authenticate - check if the passwords are the same
	 *
	 * @param {String} plainText
	 * @return {Boolean}
	 * @api public
	 */
	authenticate: function (plainText) {
		return this.password === plainText;
		return this.encryptPassword(plainText) === this.hashed_password;
	},
	/**
	 * Make salt
	 *
	 * @return {String}
	 * @api public
	 */
	makeSalt: function () {
		return Math.round((new Date().valueOf() * Math.random())) + '';
	},
	/**
	 * Encrypt password
	 *
	 * @param {String} password
	 * @return {String}
	 * @api public
	 */
	encryptPassword: function (password) {
		if (!password)
			return '';
		return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
	}
};

mongoose.model('user', UserSchema, 'User');

/**
 * User Absence Schema
 */

var UserAbsenceSchema = new Schema({
	Status: mongoose.Schema.Types.Mixed,
	user: {id: {type: String}, name: String},
	author: {id: {type: String}, name: String},
	dateStart: Date,
	dateEnd: Date,
	nbDay: Number,
	entity: String,
	closed: {type: Boolean, default: false}, // Check true if employee came back
	datec: {type: Date}
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

UserAbsenceSchema.plugin(timestamps);

var statusAbsenceList = {
	"enable": true,
	"default": "NOTJUSTIFIED",
	"values": {
		"REQUEST": {
			"enable": false,
			"label": "Demande",
			"cssClass": "blue-gradient"},
		"NOTJUSTIFIED": {
			"enable": true,
			"label": "Absence injustifiée",
			"cssClass": "red-gradient"},
		"HOLIDAY": {
			"enable": true,
			"label": "En congés",
			"cssClass": "green-gradient"},
		"ILL": {
			"enable": true,
			"label": "Absence maladie",
			"cssClass": "orange-gradient"},
		"REFUSED": {
			"enable": false,
			"label": "Refusé",
			"cssClass": "red-gradient"}
	}
};

UserAbsenceSchema.virtual('status')
		.get(function () {
			var res_status = {};

			var status = this.Status;

			if (statusAbsenceList.values[status].label) {
				//console.log(this);
				res_status.id = status;
				//this.status.name = i18n.t("intervention." + statusList.values[status].label);
				res_status.name = statusAbsenceList.values[status].label;
				res_status.css = statusAbsenceList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});


mongoose.model('userAbsence', UserAbsenceSchema, 'Absence');