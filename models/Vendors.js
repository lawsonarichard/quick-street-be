const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Vendor_Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },
  phone: {
    type: Number
  },
  zipcode: {
    type: Number
  },
  business_name: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  avatar: {
    type: Blob
  },
  vendor_banner: {
    type: Blob
  },
  vendor_category: {
    type: String
  },
  created_at: {
    type: Date
  },
  address: {
    type: String
  },
  //vendor location
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  //Vendor bulletin
  bulletins: {
    created_at: {
      type: Date
    }
  },
  //Vendor Products
  products: {
    name: {
      type: String
    },
    description: {
      type: String
    },
    category: {
      type: String
    },
    dietary: {
      type: String
    },
    price: {
      type: Number
    },
    image: {
      type: Blob
    },
    created_at: {
      type: Date
    }
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Vendors', Vendor_Schema);
