assert.reject = reject

module.exports = assert

function reject (status, message) {
  assert(false, status, message)
}

function assert (condition, status, message) {
  if (!condition) {
    let error

    if (message instanceof Error) {
      error = message
    } else {
      error = new Error(message || 'AssertionError')
    }

    error.status = status
    throw error
  }
}
