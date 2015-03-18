module.exports = {

    /**
     * Creates an event.
     * @param {string} name - The event name
     * @param {object} options - Options to be passed to event
     */
    createEvent: function (name, options) {
        var event;

        options = options || {};
        options.bubbles = options.bubbles || false;
        options.cancelable = options.cancelable|| false;

        if (typeof Event === 'function') {
            event = new Event(name, options);
        } else {
            // must register click old-fashioned way so that running tests headlessly will work
            event = document.createEvent('Event');
            event.initEvent(name, options.bubbles, options.cancelable);
        }
        return event;
    }

};
