const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  author: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
})

/**
 * Prevent JSON responses from including populated fields
 */

CommentSchema.methods.toJSON = function toJSON () {
  const props = this.toObject()

  props._id = this._id.toString()
  props.user = (props.user._id || props.user).toString()

  return props
}

exports.Schema = CommentSchema
