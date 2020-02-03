const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);


const OrderSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'Customer'
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
           
        }
    ],
    total: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

OrderSchema.plugin(deepPopulate); // now allows us to deep populate more than one level


module.exports = mongoose.model('Order', OrderSchema);