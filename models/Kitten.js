let mongoose = require('mongoose');


Schema = mongoose.Schema;

let KittySchema = new Schema({
    name: {type: String, required: false},
    birthDate: {type: Date, required: false},
    length: {type: Number, required: true}
}, {
    timestamps: true
});


let Kitty = mongoose.model('Kitten', KittySchema, 'cats');

module.exports = {
    Kitty
};